#pragma once

#include <fcitx/candidatelist.h>
#include <fcitx/inputcontext.h>

#include <cstdint>
#include <string>
#include <string_view>

namespace fcitx {

enum class CandidateIndexMode { Page, All };

struct CandidateContext {
    std::string inputContext;
    uint32_t generation;
};

CandidateContext beginCandidateUpdate(InputContext *inputContext,
                                      CandidateIndexMode indexMode);
InputContext *candidateInputContext(std::string_view inputContext,
                                    uint32_t generation);
const CandidateWord &candidateAt(const CandidateList &list, int index);

} // namespace fcitx
