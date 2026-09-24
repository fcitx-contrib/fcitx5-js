#include "candidate.h"
#include "fcitx.h"
#include "inputcontexttoken.h"

#include <stdexcept>

namespace fcitx {

namespace {

std::string currentInputContext;
uint32_t currentGeneration = 0;
CandidateIndexMode currentIndexMode = CandidateIndexMode::Page;

} // namespace

CandidateContext beginCandidateUpdate(InputContext *inputContext,
                                      CandidateIndexMode indexMode) {
    if (++currentGeneration == 0) {
        ++currentGeneration;
    }
    currentInputContext = inputContextToken(*inputContext);
    currentIndexMode = indexMode;
    return {currentInputContext, currentGeneration};
}

InputContext *candidateInputContext(std::string_view inputContext,
                                    uint32_t generation) {
    if (generation != currentGeneration ||
        inputContext != currentInputContext) {
        return nullptr;
    }
    return findInputContext(instance.get(), inputContext);
}

const CandidateWord &candidateAt(const CandidateList &list, int index) {
    if (currentIndexMode == CandidateIndexMode::All) {
        const auto &bulk = list.toBulk();
        if (!bulk) {
            throw std::invalid_argument("candidate list is not bulk");
        }
        return bulk->candidateFromAll(index);
    }
    return list.candidate(index);
}

} // namespace fcitx
