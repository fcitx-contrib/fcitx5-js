#include "wasmfrontend.h"
#include "fcitx/focusgroup.h"
#include <emscripten.h>

namespace fcitx {

WasmFrontend::WasmFrontend(Instance *instance)
    : instance_(instance),
      focusGroup_("wasm", instance->inputContextManager()) {
    eventHandler_ = instance_->watchEvent(
        EventType::InputContextInputMethodActivated, EventWatcherPhase::Default,
        [this](Event &event) { EM_ASM(fcitx.updateInputMethods()); });
    createInputContext();
    // Make mostRecentInputContext not null so that current IM info can be
    // retrieved on load finish, even if no DOM element can be actually focused
    // (e.g. when focusing on address bar).
    focusIn(false);
}

void WasmFrontend::createInputContext() {
    ic_ = new WasmInputContext(this, instance_->inputContextManager());
    ic_->setFocusGroup(&focusGroup_);
}

bool WasmFrontend::keyEvent(const Key &key, bool isRelease) {
    KeyEvent event(ic_, key, isRelease);
    ic_->keyEvent(event);
    return event.accepted();
}

void WasmFrontend::focusIn(bool isPassword) {
    CapabilityFlags flags = CapabilityFlag::Preedit;
    if (isPassword) {
        flags |= CapabilityFlag::Password;
    }
    ic_->setCapabilityFlags(flags);
    ic_->focusIn();
}

void WasmFrontend::focusOut() { ic_->focusOut(); }

void WasmFrontend::resetInput() { ic_->reset(); }

WasmInputContext::WasmInputContext(WasmFrontend *frontend,
                                   InputContextManager &inputContextManager)
    : InputContext(inputContextManager, ""), frontend_(frontend) {
    created();
}

WasmInputContext::~WasmInputContext() { destroy(); }

void WasmInputContext::commitStringImpl(const std::string &text) {
    EM_ASM(fcitx.commit(UTF8ToString($0)), text.c_str());
}

void WasmInputContext::updatePreeditImpl() {
    auto preedit =
        frontend_->instance()->outputFilter(this, inputPanel().clientPreedit());
    EM_ASM(fcitx.setPreedit(UTF8ToString($0), $1), preedit.toString().c_str(),
           preedit.cursor());
}
} // namespace fcitx

FCITX_ADDON_FACTORY_V2(wasmfrontend, fcitx::WasmFrontendFactory);
