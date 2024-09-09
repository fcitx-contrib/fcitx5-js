#include <emscripten.h>
#include <fcitx/action.h>
#include <fcitx/instance.h>
#include <fcitx/menu.h>
#include <fcitx/statusarea.h>
#include <fcitx/userinterfacemanager.h>
#include <nlohmann/json.hpp>

namespace fcitx {
extern std::unique_ptr<Instance> instance;

static nlohmann::json actionToJson(Action *action, InputContext *ic) {
    nlohmann::json j;
    j["id"] = action->id();
    j["desc"] = action->shortText(ic);
    if (action->isSeparator()) {
        j["separator"] = true;
    }
    if (action->isCheckable()) {
        bool checked = action->isChecked(ic);
        j["checked"] = checked;
    }
    if (auto *menu = action->menu()) {
        for (auto *subaction : menu->actions()) {
            j["children"].emplace_back(actionToJson(subaction, ic));
        }
    }
    return j;
}

extern "C" {
EMSCRIPTEN_KEEPALIVE const char *get_menu_actions() {
    static std::string ret;
    if (auto *ic = instance->mostRecentInputContext()) {
        nlohmann::json j = nlohmann::json::array();
        auto &statusArea = ic->statusArea();
        for (auto *action : statusArea.allActions()) {
            if (!action->id()) {
                // Not registered with UI manager.
                continue;
            }
            j.emplace_back(actionToJson(action, ic));
        }
        ret = j.dump();
        return ret.c_str();
    }
    return "[]";
}

EMSCRIPTEN_KEEPALIVE void activate_menu_action(int id) {
    if (auto *ic = instance->mostRecentInputContext()) {
        auto *action = instance->userInterfaceManager().lookupActionById(id);
        action->activate(ic);
    }
}
}
} // namespace fcitx
