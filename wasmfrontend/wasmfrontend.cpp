#include "wasmfrontend.h"
#include <emscripten.h>
#include <fcitx/focusgroup.h>

namespace fcitx {
WasmFrontend::WasmFrontend(Instance *instance)
    : instance_(instance),
      focusGroup_("wasm", instance->inputContextManager()) {
    eventHandler_ = instance_->watchEvent(
        EventType::InputContextInputMethodActivated, EventWatcherPhase::Default,
        [this](Event &event) { EM_ASM(fcitx.updateInputMethods()); });
}

WasmFrontend::~WasmFrontend() = default;

WasmInputContextId
WasmFrontend::createInputContext(const std::string &program) {
    do {
        ++nextInputContextId_;
    } while (nextInputContextId_ == 0 ||
             inputContexts_.contains(nextInputContextId_));
    auto id = nextInputContextId_;
    auto ic = std::make_unique<WasmInputContext>(
        this, instance_->inputContextManager(), program, id);
    ic->setFocusGroup(&focusGroup_);
    inputContexts_[id] = std::move(ic);
    return id;
}

void WasmFrontend::destroyInputContext(WasmInputContextId id) {
    auto iter = inputContexts_.find(id);
    if (iter == inputContexts_.end()) {
        return;
    }
    auto *ic = iter->second.get();
    if (ic->hasFocus()) {
        ic->focusOut();
    }
    inputContexts_.erase(iter);
}

WasmInputContext *WasmFrontend::findInputContext(WasmInputContextId id) const {
    auto iter = inputContexts_.find(id);
    return iter == inputContexts_.end() ? nullptr : iter->second.get();
}

bool WasmFrontend::keyEvent(WasmInputContextId id, const Key &key,
                            bool isRelease) {
    auto *ic = findInputContext(id);
    if (!ic) {
        return false;
    }
    ic->focusIn();
    KeyEvent event(ic, key, isRelease);
    ic->keyEvent(event);
    return event.accepted();
}

void WasmFrontend::focusIn(WasmInputContextId id, bool isPassword) {
    auto *ic = findInputContext(id);
    if (!ic) {
        return;
    }
    CapabilityFlags flags = CapabilityFlag::Preedit;
    if (isPassword) {
        flags |= CapabilityFlag::Password;
    } else {
        flags |= CapabilityFlag::SurroundingText;
    }
    ic->setCapabilityFlags(flags);
    ic->focusIn();
}

void WasmFrontend::focusOut(WasmInputContextId id) {
    if (auto *ic = findInputContext(id); ic && ic->hasFocus()) {
        ic->focusOut();
    }
}

void WasmFrontend::resetInput(WasmInputContextId id) {
    if (auto *ic = findInputContext(id)) {
        ic->reset();
    }
}

void WasmFrontend::setSurroundingText(WasmInputContextId id,
                                      const std::string &text,
                                      unsigned int cursor,
                                      unsigned int anchor) {
    if (auto *ic = findInputContext(id)) {
        ic->surroundingText().setText(text, cursor, anchor);
        ic->updateSurroundingText();
    }
}

WasmInputContext::WasmInputContext(WasmFrontend *frontend,
                                   InputContextManager &inputContextManager,
                                   const std::string &program,
                                   WasmInputContextId id)
    : InputContext(inputContextManager, program), frontend_(frontend), id_(id) {
    created();
}

WasmInputContext::~WasmInputContext() { destroy(); }

void WasmInputContext::deleteSurroundingTextImpl(int offset,
                                                 unsigned int size) {
    EM_ASM(fcitx.deleteSurroundingText($0, $1, $2), id_, offset, size);
}

void WasmInputContext::commitStringImpl(const std::string &text) {
    EM_ASM(fcitx.commit($0, UTF8ToString($1)), id_, text.c_str());
}

void WasmInputContext::updatePreeditImpl() {
    auto preedit =
        frontend_->instance()->outputFilter(this, inputPanel().clientPreedit());
    EM_ASM(fcitx.setPreedit($0, UTF8ToString($1), $2), id_,
           preedit.toString().c_str(), preedit.cursor());
}
} // namespace fcitx

FCITX_ADDON_FACTORY_V2(wasmfrontend, fcitx::WasmFrontendFactory);
