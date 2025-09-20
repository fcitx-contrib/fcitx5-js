#include "chromepanel.h"
#include <emscripten.h>
#include <fcitx/inputpanel.h>
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

ChromePanel::ChromePanel(Instance *instance) : instance_(instance) {}

void ChromePanel::update(UserInterfaceComponent component,
                         InputContext *inputContext) {
    switch (component) {
    case UserInterfaceComponent::InputPanel: {
        const InputPanel &inputPanel = inputContext->inputPanel();
        std::vector<Candidate> candidates;
        int highlighted = -1;
        if (const auto &list = inputPanel.candidateList()) {
            auto size = list->size();
            candidates.reserve(size);
            for (int i = 0; i < size; ++i) {
                const auto &candidate = list->candidate(i);
                auto label = list->label(i).toString();
                // HACK: fcitx5's Linux UI concatenates label and text and
                // expects engine to append a ' ' to label.
                auto length = label.length();
                if (length && label[length - 1] == ' ') {
                    label = label.substr(0, length - 1);
                }
                candidates.push_back(
                    {instance_->outputFilter(inputContext, candidate.text())
                         .toString(),
                     label,
                     instance_->outputFilter(inputContext, candidate.comment())
                         .toString()});
                highlighted = list->cursorIndex();
            }
        }
        auto str =
            json{{"candidates", candidates}, {"highlighted", highlighted}}
                .dump();
        EM_ASM(fcitx.chrome.setCandidates(UTF8ToString($0)), str.c_str());
        break;
    }
    }
}
} // namespace fcitx

FCITX_ADDON_FACTORY_V2(chromepanel, fcitx::ChromePanelFactory);
