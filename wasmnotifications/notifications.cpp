#include "notifications.h"
#include <emscripten.h>
#include <nlohmann/json.hpp>

using json = nlohmann::json;

namespace fcitx {
Notifications::Notifications(Instance *instance) { reloadConfig(); }

void Notifications::updateConfig() {
    hiddenNotifications_.clear();
    for (const auto &id : config_.hiddenNotifications.value()) {
        hiddenNotifications_.insert(id);
    }
}

void Notifications::reloadConfig() {
    readAsIni(config_, ConfPath);
    updateConfig();
}

void Notifications::save() {
    std::vector<std::string> values_;
    for (const auto &id : hiddenNotifications_) {
        values_.push_back(id);
    }
    config_.hiddenNotifications.setValue(std::move(values_));
    safeSaveAsIni(config_, ConfPath);
}

uint32_t Notifications::sendNotification(
    const std::string &appName, uint32_t replaceId, const std::string &appIcon,
    const std::string &summary, const std::string &body,
    const std::vector<std::string> &actions, int32_t timeout,
    NotificationActionCallback actionCallback,
    NotificationClosedCallback closedCallback) {
    actionCallback_ = std::move(actionCallback);
    auto j = nlohmann::json::array();
    for (size_t i = 0; i + 1 < actions.size(); i += 2) {
        j.push_back({{"id", actions[i]}, {"text", actions[i + 1]}});
    }
    auto actionString = j.dump();
    EM_ASM(fcitx.notify(UTF8ToString($0), UTF8ToString($1), UTF8ToString($2),
                        $3, "", UTF8ToString($4)),
           appName.c_str(), appIcon.c_str(), body.c_str(), timeout,
           actionString.c_str());
    return 0;
}

void Notifications::activateAction(const std::string &action) {
    if (actionCallback_) {
        actionCallback_.value()(action);
        actionCallback_.reset();
    }
}

void Notifications::showTip(const std::string &tipId,
                            const std::string &appName,
                            const std::string &appIcon,
                            const std::string &summary, const std::string &body,
                            int32_t timeout) {
    if (hiddenNotifications_.count(tipId)) {
        return;
    }
    EM_ASM(fcitx.notify(UTF8ToString($0), UTF8ToString($1), UTF8ToString($2),
                        $3, UTF8ToString($4)),
           appName.c_str(), appIcon.c_str(), body.c_str(), timeout,
           tipId.c_str());
}

void Notifications::disableTip(const std::string &tipId) {
    hiddenNotifications_.insert(tipId);
    save();
}

void Notifications::closeNotification(uint64_t internalId) {
    // Design choice: disable closing notification from fcitx and let JS
    // initiate it.
    FCITX_DEBUG() << "closeNotification " << internalId;
}
} // namespace fcitx

FCITX_ADDON_FACTORY_V2(notifications, fcitx::WasmNotificationsFactory);
