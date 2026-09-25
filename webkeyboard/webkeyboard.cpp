#include "webkeyboard.h"
#include "../src/action.h"
#include <emscripten.h>
#include <fcitx/action.h>
#include <fcitx/inputpanel.h>
#include <fcitx/menu.h>
#include <fcitx/statusarea.h>

namespace fcitx {

// Name and usages are copied from fcitx5-harmony, but is actually sync.
void notify_main_async(const std::string &str) {
    EM_ASM(fcitx.sendEventToKeyboard(UTF8ToString($0)), str.c_str());
}

WebKeyboard::WebKeyboard(Instance *instance) : instance_(instance) {}

void WebKeyboard::update(UserInterfaceComponent component,
                         InputContext *inputContext) {
    switch (component) {
    case UserInterfaceComponent::InputPanel: {
        int highlighted = -1;
        std::vector<Candidate> candidates;
        const InputPanel &inputPanel = inputContext->inputPanel();
        const auto &list = inputPanel.candidateList();
        const auto candidateContext = beginCandidateUpdate(
            inputContext, list && list->toBulk() ? CandidateIndexMode::All
                                                 : CandidateIndexMode::Page);
        Text preedit, auxUp;
        if (!inputPanel.empty()) {
            preedit =
                instance_->outputFilter(inputContext, inputPanel.preedit());
            auxUp = instance_->outputFilter(inputContext, inputPanel.auxUp());
        } else if (!inputPanel.overlayMessage().empty()) {
            auxUp = inputPanel.overlayMessage();
        }
        notify_main_async(json{{"type", "PREEDIT"},
                               {"data",
                                {{"auxUp", auxUp.toString()},
                                 {"preedit", preedit.toString()},
                                 {"caret", inputPanel.preedit().cursor()}}}}
                              .dump());
        if (list) {
            const auto &bulk = list->toBulk();
            if (bulk) {
                return expand(candidateContext);
            }
            int size = list->size();
            candidates.reserve(size);
            for (int i = 0; i < size; ++i) {
                const auto &label =
                    stringutils::trim(list->label(i).toString());
                const auto &candidate = list->candidate(i);
                candidates.push_back(
                    {instance_->outputFilter(inputContext, candidate.text())
                         .toString(),
                     label,
                     instance_->outputFilter(inputContext, candidate.comment())
                         .toString()});
            }
            highlighted = list->cursorIndex();
        }
        if (auxUp.empty() && preedit.empty() && candidates.empty()) {
            notify_main_async(R"JSON({"type":"CLEAR"})JSON");
        } else {
            setCandidatesAsync(candidateContext, candidates, highlighted, 0,
                               false, false,
                               !inputPanel.clientPreedit().empty(), {});
        }
        break;
    }
    case UserInterfaceComponent::StatusArea:
        updateStatusArea(inputContext);
        break;
    }
}

void WebKeyboard::setCandidatesAsync(
    const CandidateContext &candidateContext,
    const std::vector<Candidate> &candidates, int highlighted, int scrollState,
    bool scrollStart, bool scrollEnd, bool hasClientPreedit,
    const std::span<const CandidateAction> &actions) {
    auto j = json{{"type", "CANDIDATES"},
                  {"data",
                   {{"inputContext", candidateContext.inputContext},
                    {"generation", candidateContext.generation},
                    {"candidates", candidates},
                    {"highlighted", highlighted},
                    {"scrollState", scrollState},
                    {"scrollStart", scrollStart},
                    {"scrollEnd", scrollEnd},
                    {"hasClientPreedit", hasClientPreedit},
                    {"tabActions", actions}}}};
    notify_main_async(j.dump());
}

// Vertically 2 screens.
void WebKeyboard::expand(const CandidateContext &candidateContext) {
    scroll(candidateContext.inputContext, candidateContext.generation, 0, 60);
}

void WebKeyboard::scroll(std::string_view inputContext, uint32_t generation,
                         int start, int count) {
    auto *ic = candidateInputContext(inputContext, generation);
    if (!ic) {
        return;
    }
    const auto &list = ic->inputPanel().candidateList();
    if (!list) {
        return;
    }
    const auto &bulk = list->toBulk();
    if (!bulk) {
        return;
    }
    int size = bulk->totalSize();
    int end = size < 0 ? start + count : std::min(start + count, size);
    bool endReached = size == end;
    std::vector<Candidate> candidates;
    for (int i = start; i < end; ++i) {
        try {
            auto &candidate = bulk->candidateFromAll(i);
            candidates.push_back(
                {instance_->outputFilter(ic, candidate.text()).toString(), "",
                 instance_->outputFilter(ic, candidate.comment()).toString()});
        } catch (const std::invalid_argument &e) {
            // size == -1 but actual limit is reached
            endReached = true;
            break;
        }
    }
    std::span<const CandidateAction> tabbedActions;
    if (const auto &tabbed = list->toTabbed()) {
        tabbedActions = tabbed->tabActions();
    }
    setCandidatesAsync({std::string(inputContext), generation}, candidates,
                       start == 0 ? 0 : -1, 2, start == 0, endReached,
                       !ic->inputPanel().clientPreedit().empty(),
                       tabbedActions);
}

void WebKeyboard::updateStatusArea(InputContext *ic) {
    if (!ic->hasFocus()) {
        return;
    }
    auto statusArea = statusAreaData(ic);
    if (!statusArea) {
        return;
    }
    notify_main_async(
        json{{"type", "STATUS_AREA"}, {"data", *statusArea}}.dump());
}

} // namespace fcitx

FCITX_ADDON_FACTORY_V2(webkeyboard, fcitx::WebKeyboardFactory)
