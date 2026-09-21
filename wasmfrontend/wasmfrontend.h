#pragma once

#include <fcitx-config/configuration.h>
#include <fcitx/addonfactory.h>
#include <fcitx/addoninstance.h>
#include <fcitx/addonmanager.h>
#include <fcitx/focusgroup.h>
#include <fcitx/instance.h>

#include <cstdint>
#include <memory>
#include <string>
#include <unordered_map>

namespace fcitx {

class WasmInputContext;

using WasmInputContextId = uint32_t;

class WasmFrontend : public AddonInstance {
  public:
    WasmFrontend(Instance *instance);
    ~WasmFrontend();
    Instance *instance() { return instance_; }

    void reloadConfig() override {}
    void save() override {}
    const Configuration *getConfig() const override { return nullptr; }
    void setConfig(const RawConfig &config) override {}

    WasmInputContextId createInputContext(const std::string &program);
    void destroyInputContext(WasmInputContextId id);
    bool keyEvent(WasmInputContextId id, const Key &key, bool isRelease);
    void focusIn(WasmInputContextId id, bool isPassword);
    void focusOut(WasmInputContextId id);
    void resetInput(WasmInputContextId id);
    void setSurroundingText(WasmInputContextId id, const std::string &text,
                            unsigned int cursor, unsigned int anchor);

  private:
    WasmInputContext *findInputContext(WasmInputContextId id) const;

    Instance *instance_;
    FocusGroup focusGroup_;
    std::unordered_map<WasmInputContextId, std::unique_ptr<WasmInputContext>>
        inputContexts_;
    WasmInputContextId nextInputContextId_ = 0;
    std::unique_ptr<HandlerTableEntry<EventHandler>> eventHandler_;
};

class WasmFrontendFactory : public AddonFactory {
  public:
    AddonInstance *create(AddonManager *manager) override {
        return new WasmFrontend(manager->instance());
    }
};

class WasmInputContext : public InputContext {
  public:
    WasmInputContext(WasmFrontend *frontend,
                     InputContextManager &inputContextManager,
                     const std::string &program, WasmInputContextId id);
    ~WasmInputContext();

    const char *frontend() const override { return "wasm"; }
    void commitStringImpl(const std::string &text) override;
    void deleteSurroundingTextImpl(int offset, unsigned int size) override;
    void forwardKeyImpl(const ForwardKeyEvent &key) override {}
    void updatePreeditImpl() override;

  private:
    WasmFrontend *frontend_;
    WasmInputContextId id_;
};
} // namespace fcitx
