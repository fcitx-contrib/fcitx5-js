#include "wasmfrontend.h"
#include "fcitx/focusgroup.h"

namespace fcitx {

WasmFrontend::WasmFrontend(Instance *instance)
    : instance_(instance),
      focusGroup_("wasm", instance->inputContextManager()) {
    createInputContext();
}

void WasmFrontend::createInputContext() {
    ic_ = new WasmInputContext(this, instance_->inputContextManager());
    ic_->setFocusGroup(&focusGroup_);
}

bool WasmFrontend::keyEvent(const Key &key) {
    KeyEvent event(ic_, key, false);
    ic_->keyEvent(event);
    return event.accepted();
}

void WasmFrontend::focusIn() { ic_->focusIn(); }

void WasmFrontend::focusOut() { ic_->focusOut(); }

WasmInputContext::WasmInputContext(WasmFrontend *frontend,
                                   InputContextManager &inputContextManager)
    : InputContext(inputContextManager, "") {
    CapabilityFlags flags = CapabilityFlag::Preedit;
    setCapabilityFlags(flags);
    created();
}

WasmInputContext::~WasmInputContext() { destroy(); }

void WasmInputContext::commitStringImpl(const std::string &text) {
    std::cerr << text << std::endl;
}
} // namespace fcitx
