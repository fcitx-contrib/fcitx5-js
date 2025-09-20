#pragma once

#include <fcitx/addonfactory.h>
#include <fcitx/addonmanager.h>
#include <fcitx/instance.h>

namespace fcitx {
class ChromePanel final : public UserInterface {
  public:
    ChromePanel(Instance *);
    virtual ~ChromePanel() = default;
    void reloadConfig() override {}
    void setConfig(const RawConfig &config) override {}
    void setSubConfig(const std::string &path,
                      const RawConfig &config) override {}
    bool available() override { return true; }
    void suspend() override {}
    void resume() override {}
    void update(UserInterfaceComponent component,
                InputContext *inputContext) override;

  private:
    Instance *instance_;
};

class ChromePanelFactory : public AddonFactory {
  public:
    AddonInstance *create(AddonManager *manager) override {
        return new ChromePanel(manager->instance());
    }
};
} // namespace fcitx
