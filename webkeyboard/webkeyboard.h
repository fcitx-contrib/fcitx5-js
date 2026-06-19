#pragma once

#include <fcitx/addonfactory.h>
#include <fcitx/addoninstance.h>
#include <fcitx/addonmanager.h>
#include <fcitx/candidatelist.h>
#include <fcitx/instance.h>
#include <nlohmann/json.hpp>

using json = nlohmann::json;

namespace fcitx {

struct Candidate {
    std::string text;
    std::string label;
    std::string comment;

    friend void to_json(json &j, const Candidate &c) {
        j = json{{"label", c.label}, {"text", c.text}, {"comment", c.comment}};
    }
};

inline void to_json(json &j, const CandidateAction &action) {
    j = json{{"id", action.id()},
             {"text", action.text()},
             {"checked", action.isChecked()},
             {"checkable", action.isCheckable()},
             {"separator", action.isSeparator()}};
}

inline void to_json(json &j, const std::span<const CandidateAction> &actions) {
    j = json::array();
    for (const auto &action : actions) {
        j.push_back(action);
    }
}

class WebKeyboard final : public VirtualKeyboardUserInterface {
  public:
    WebKeyboard(Instance *instance);
    virtual ~WebKeyboard() = default;

    void reloadConfig() override {}
    const Configuration *getConfig() const override { return nullptr; }
    void setConfig(const RawConfig &config) override {}
    void setSubConfig(const std::string &path,
                      const RawConfig &config) override {}

    Instance *instance() { return instance_; }

    bool available() override { return true; }
    void suspend() override {}
    void resume() override {}
    void update(UserInterfaceComponent component,
                InputContext *inputContext) override;
    bool isVirtualKeyboardVisible() const override { return true; }
    void showVirtualKeyboard() override {}
    void hideVirtualKeyboard() override {}
    void updateStatusArea(InputContext *ic);
    void scroll(int start, int count);

  private:
    Instance *instance_;

    void setCandidatesAsync(const std::vector<Candidate> &candidates,
                            int highlighted, int scrollState, bool scrollStart,
                            bool scrollEnd, bool hasClientPreedit,
                            const std::span<const CandidateAction> &actions);
    void expand();
};

class WebKeyboardFactory : public AddonFactory {
  public:
    AddonInstance *create(AddonManager *manager) override {
        return new WebKeyboard(manager->instance());
    }
};
} // namespace fcitx
