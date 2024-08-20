#include <emscripten.h>
#include <fcitx/inputmethodentry.h>
#include <fcitx/inputmethodmanager.h>
#include <fcitx/instance.h>
#include <nlohmann/json.hpp>

namespace fcitx {
extern std::unique_ptr<Instance> instance;

static nlohmann::json json_describe_im(const fcitx::InputMethodEntry *entry) {
    nlohmann::json j;
    j["name"] = entry->uniqueName();
    j["displayName"] = entry->nativeName() != "" ? entry->nativeName()
                       : entry->name() != ""     ? entry->name()
                                                 : entry->uniqueName();
    return j;
}

extern "C" {
EMSCRIPTEN_KEEPALIVE void set_current_input_method(const char *im) {
    instance->setCurrentInputMethod(im);
}

EMSCRIPTEN_KEEPALIVE const char *current_input_method() {
    static std::string im;
    im = instance->currentInputMethod();
    return im.c_str();
}

EMSCRIPTEN_KEEPALIVE const char *get_input_methods() {
    static std::string ret;
    nlohmann::json j;
    auto &imMgr = instance->inputMethodManager();
    auto group = imMgr.currentGroup();
    bool empty = true;
    for (const auto &im : group.inputMethodList()) {
        auto entry = imMgr.entry(im.name());
        if (!entry)
            continue;
        empty = false;
        j.push_back(json_describe_im(entry));
    }
    if (empty) { // j is not treated array
        return "[]";
    }
    ret = j.dump();
    return ret.c_str();
}

EMSCRIPTEN_KEEPALIVE void set_input_methods(const char *json) {
    auto &imMgr = instance->inputMethodManager();
    auto group = imMgr.currentGroup();
    auto &imList = group.inputMethodList();
    imList.clear();
    auto j = nlohmann::json::parse(json);
    for (const auto &im : j) {
        imList.emplace_back(im.get<std::string>());
    }
    imMgr.setGroup(group);
    imMgr.save();
}
}
} // namespace fcitx
