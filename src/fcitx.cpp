#include "fcitx.h"
#include "../fcitx5/src/modules/clipboard/clipboard_public.h"
#include "../wasmfrontend/wasmfrontend.h"
#include "../wasmnotifications/notifications.h"
#include "../webkeyboard/webkeyboard.h"
#include "event_js.h"
#include "isocodes.h"
#include "keycode.h"
#include <emscripten.h>
#include <fcitx-utils/event.h>
#include <fcitx-utils/i18n.h>
#include <fcitx-utils/standardpaths.h>
#include <fcitx/action.h>
#include <fcitx/inputmethodmanager.h>
#include <fcitx/userinterfacemanager.h>
#include <sys/stat.h>

FCITX_DEFINE_STATIC_ADDON_REGISTRY(getStaticAddon)

namespace fcitx {

std::unique_ptr<Instance> instance;
WasmFrontend *frontend;
WebKeyboard *ui;
Notifications *notifications;
AddonInstance *clipboard;
Runtime runtime;

#ifdef ENABLE_KEYBOARD
IsoCodes isoCodes;
#endif

void notify_main_async(const std::string &str);

static void answerCandidateAction(ActionableCandidateList *actionableList,
                                  const CandidateWord &candidate, int index) {
    if (actionableList->hasAction(candidate)) {
        json actions = json::array();
        for (const auto &action : actionableList->candidateActions(candidate)) {
            actions.push_back({{"id", action.id()}, {"text", action.text()}});
        }
        notify_main_async(
            json{{"type", "CANDIDATE_ACTIONS"},
                 {"data", {{"index", index}, {"actions", actions}}}}
                .dump());
    }
}

// This has to be defined in f5j instead of librime.so because the latter is
// compiled to eval(), which is banned by service worker's CSP.
EMSCRIPTEN_KEEPALIVE int deployRimeInWorker() {
    return EM_ASM_INT(return fcitx.deployRimeInWorker());
}

extern "C" {

EMSCRIPTEN_KEEPALIVE void focus_in(bool isPassword) {
    frontend->focusIn(isPassword);
}

EMSCRIPTEN_KEEPALIVE void focus_out() { frontend->focusOut(); }

EMSCRIPTEN_KEEPALIVE void reset_input() { frontend->resetInput(); }

EMSCRIPTEN_KEEPALIVE bool process_key(const char *key, const char *code,
                                      uint32_t modifiers, bool isRelease) {
    return frontend->keyEvent(js_key_to_fcitx_key(key, code, modifiers),
                              isRelease);
}

EMSCRIPTEN_KEEPALIVE void toggle() { instance->toggle(); }

// For virtual keyboard (scroll mode whenever possible) and ChromeOS (normal
// mode) only.
EMSCRIPTEN_KEEPALIVE void select_candidate(int index) {
    auto ic = instance->mostRecentInputContext();
    const auto &list = ic->inputPanel().candidateList();
    if (!list)
        return;
    const auto &bulk = list->toBulk();
    if (runtime != Runtime::serviceworker &&
        bulk) { // ChromeOS doesn't support scroll mode.
        try {
            bulk->candidateFromAll(index).select(ic);
        } catch (const std::invalid_argument &e) {
            FCITX_ERROR() << "select candidate index out of range";
        }
        return;
    }
    try {
        // Engine is responsible for updating UI
        list->candidate(index).select(ic);
    } catch (const std::invalid_argument &e) {
        FCITX_ERROR() << "select candidate index out of range";
    }
}

EMSCRIPTEN_KEEPALIVE void ask_candidate_actions(int index) {
    auto ic = instance->mostRecentInputContext();
    const auto &list = ic->inputPanel().candidateList();
    if (!list)
        return;
    auto *actionableList = list->toActionable();
    if (!actionableList) {
        return;
    }
    const auto &bulk = list->toBulk();
    if (bulk) {
        try {
            auto &candidate = bulk->candidateFromAll(index);
            answerCandidateAction(actionableList, candidate, index);
        } catch (const std::invalid_argument &e) {
            FCITX_ERROR() << "action candidate index out of range";
        }
        return;
    }
    try {
        auto &candidate = list->candidate(index);
        answerCandidateAction(actionableList, candidate, index);
    } catch (const std::invalid_argument &e) {
        FCITX_ERROR() << "action candidate index out of range";
    }
}

EMSCRIPTEN_KEEPALIVE void activate_candidate_action(int index, int id) {
    auto ic = instance->mostRecentInputContext();
    const auto &list = ic->inputPanel().candidateList();
    if (!list)
        return;
    auto *actionableList = list->toActionable();
    if (!actionableList) {
        return;
    }
    const auto &bulk = list->toBulk();
    if (bulk) {
        try {
            const auto &candidate = bulk->candidateFromAll(index);
            if (actionableList->hasAction(candidate)) {
                actionableList->triggerAction(candidate, id);
            }
        } catch (const std::invalid_argument &e) {
            FCITX_ERROR() << "action candidate index out of range";
        }
        return;
    }
    try {
        auto &candidate = list->candidate(index);
        if (actionableList->hasAction(candidate)) {
            actionableList->triggerAction(candidate, id);
        }
    } catch (const std::invalid_argument &e) {
        FCITX_ERROR() << "action candidate index out of range";
    }
}

EMSCRIPTEN_KEEPALIVE void scroll(int start, int count) {
    ui->scroll(start, count);
}

EMSCRIPTEN_KEEPALIVE void write_clipboard(const char *text) {
    if (clipboard != nullptr) {
        clipboard->call<IClipboard::setClipboardV2>("", text, false);
    }
}

EMSCRIPTEN_KEEPALIVE void write_primary(const char *text) {
    if (clipboard != nullptr) {
        clipboard->call<IClipboard::setPrimaryV2>("", text, false);
    }
}

EMSCRIPTEN_KEEPALIVE const char *translate_domain(const char *domain,
                                                  const char *text) {
    static std::string ret;
    ret = translateDomain(domain, text);
    return ret.c_str();
}

EMSCRIPTEN_KEEPALIVE void notification_action(const char *action,
                                              const char *tipId) {
    if (tipId[0]) { // action is dont-show
        notifications->disableTip(tipId);
    } else {
        notifications->activateAction(action);
    }
}

EMSCRIPTEN_KEEPALIVE void init(const char *locale, Runtime runtime,
                               bool touch) {
    if (instance) {
        return;
    }
    fcitx::runtime = runtime;
    umask(007); // Fix config file's mode
    StandardPaths::global().syncUmask();
#ifdef NDEBUG
    Log::setLogRule("*=4,notimedate");
#else
    Log::setLogRule("*=5,notimedate");
#endif

    setlocale(LC_ALL, locale); // emscripten musl specific.
#ifdef ENABLE_KEYBOARD
    isoCodes.read(ISOCODES_ISO639_JSON);
    setenv("XKB_CONFIG_ROOT", "/usr/share/xkeyboard-config-2", 1);
#endif

    EventLoop::setEventLoopFactory(
        [] { return std::make_unique<JSEventLoop>(); });

    char arg0[] = "fcitx5-js";
    switch (runtime) {
    case Runtime::web: {
        char arg1[] = "--disable=chromepanel";
        char *argv[] = {arg0, arg1};
        instance = std::make_unique<Instance>(FCITX_ARRAY_SIZE(argv), argv);
        if (touch) {
            instance->setInputMethodMode(InputMethodMode::OnScreenKeyboard);
        }
        break;
    }
    case Runtime::webworker: {
        char arg1[] = "--disable=all";
        char arg2[] = "--enable=rime,notifications";
        char *argv[] = {arg0, arg1, arg2};
        instance = std::make_unique<Instance>(FCITX_ARRAY_SIZE(argv), argv);
        break;
    }
    case Runtime::serviceworker:
    case Runtime::options: {
        char arg1[] = "--disable=webkeyboard,webpanel";
        char *argv[] = {arg0, arg1};
        instance = std::make_unique<Instance>(FCITX_ARRAY_SIZE(argv), argv);
        break;
    }
    }
    auto &addonMgr = instance->addonManager();
    addonMgr.registerDefaultLoader(&getStaticAddon());
    instance->initialize(); // Unnecessary to call exec.
    frontend = dynamic_cast<WasmFrontend *>(addonMgr.addon("wasmfrontend"));
    ui = dynamic_cast<WebKeyboard *>(addonMgr.addon("webkeyboard"));
    notifications =
        dynamic_cast<Notifications *>(addonMgr.addon("notifications"));
    clipboard = addonMgr.addon("clipboard", true);
}

EMSCRIPTEN_KEEPALIVE void reload(const char *locale, Runtime runtime,
                                 bool touch) {
    if (!instance) { // Pre-install plugins.
        return init(locale, runtime, touch);
    }
    instance->reloadConfig();
    instance->refresh();
    auto &addonManager = instance->addonManager();
    for (const auto category :
         {fcitx::AddonCategory::InputMethod, fcitx::AddonCategory::Frontend,
          fcitx::AddonCategory::Loader, fcitx::AddonCategory::Module,
          fcitx::AddonCategory::UI}) {
        const auto names = addonManager.addonNames(category);
        for (const auto &name : names) {
            instance->reloadAddonConfig(name);
        }
    }
    instance->inputMethodManager().load();
}
}
} // namespace fcitx
