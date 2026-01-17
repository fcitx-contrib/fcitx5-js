#pragma once

#include <fcitx-config/iniparser.h>
#include <fcitx-utils/i18n.h>
#include <fcitx/addonfactory.h>
#include <fcitx/addoninstance.h>
#include <fcitx/addonmanager.h>
#include <fcitx/instance.h>
#include <notifications_public.h>

namespace fcitx {
FCITX_CONFIGURATION(NotificationsConfig,
                    Option<std::vector<std::string>> hiddenNotifications{
                        this, "HiddenNotifications",
                        translateDomain("fcitx5", "Hidden Notifications")};);

class Notifications final : public AddonInstance {
  public:
    Notifications(Instance *instance);
    ~Notifications() = default;

    void updateConfig();
    void reloadConfig() override;
    void save() override;
    const Configuration *getConfig() const override { return &config_; }
    void setConfig(const RawConfig &config) override {
        config_.load(config, true);
        safeSaveAsIni(config_, ConfPath);
        updateConfig();
    }

    uint32_t sendNotification(const std::string &appName, uint32_t replaceId,
                              const std::string &appIcon,
                              const std::string &summary,
                              const std::string &body,
                              const std::vector<std::string> &actions,
                              int32_t timeout,
                              NotificationActionCallback actionCallback,
                              NotificationClosedCallback closedCallback);
    void showTip(const std::string &tipId, const std::string &appName,
                 const std::string &appIcon, const std::string &summary,
                 const std::string &body, int32_t timeout);

    void activateAction(const std::string &action);
    void disableTip(const std::string &tipId);

    void closeNotification(uint64_t internalId);

  private:
    FCITX_ADDON_EXPORT_FUNCTION(Notifications, sendNotification);
    FCITX_ADDON_EXPORT_FUNCTION(Notifications, showTip);
    FCITX_ADDON_EXPORT_FUNCTION(Notifications, closeNotification);

    static const inline std::string ConfPath = "conf/wasmnotifications.conf";
    NotificationsConfig config_;
    std::unordered_set<std::string> hiddenNotifications_;
    std::optional<NotificationActionCallback> actionCallback_;
};

class WasmNotificationsFactory : public AddonFactory {
    AddonInstance *create(AddonManager *manager) override {
        return new Notifications(manager->instance());
    }
};
} // namespace fcitx
