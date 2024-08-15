#pragma once

#include <fcitx-config/configuration.h>
#include <fcitx/addonfactory.h>
#include <fcitx/addoninstance.h>
#include <fcitx/addonmanager.h>
#include <fcitx/focusgroup.h>
#include <fcitx/instance.h>

namespace fcitx {

class WasmInputContext;

class WasmFrontend : public AddonInstance {
  public:
    WasmFrontend(Instance *instance);
    void reloadConfig() override {}
    void save() override {}
    const Configuration *getConfig() const override { return nullptr; }
    void setConfig(const RawConfig &config) override {}

    void createInputContext();
    bool keyEvent(const Key &key, bool isRelease);
    void focusIn();
    void focusOut();

  private:
    Instance *instance_;
    FocusGroup focusGroup_;
    WasmInputContext *ic_;
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
                     InputContextManager &inputContextManager);
    ~WasmInputContext();

    const char *frontend() const override { return "wasm"; }
    void commitStringImpl(const std::string &text) override;
    void deleteSurroundingTextImpl(int offset, unsigned int size) override {}
    void forwardKeyImpl(const ForwardKeyEvent &key) override {}
    void updatePreeditImpl() override {};
};
} // namespace fcitx
