#include "isocodes.h"
#include <emscripten.h>
#include <fcitx-utils/i18n.h>
#include <fcitx/inputmethodentry.h>
#include <fcitx/inputmethodmanager.h>
#include <fcitx/instance.h>
#include <nlohmann/json.hpp>

#define ISO_639_3_DOMAIN "iso_639-3"

namespace fcitx {
extern std::unique_ptr<Instance> instance;
extern IsoCodes isoCodes;

static nlohmann::json json_describe_im(const fcitx::InputMethodEntry *entry) {
    nlohmann::json j;
    j["name"] = entry->uniqueName();
    j["displayName"] = entry->nativeName() != "" ? entry->nativeName()
                       : entry->name() != ""     ? entry->name()
                                                 : entry->uniqueName();
    j["languageCode"] = entry->languageCode();
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
    auto j = nlohmann::json::array();
    auto &imMgr = instance->inputMethodManager();
    auto group = imMgr.currentGroup();
    for (const auto &im : group.inputMethodList()) {
        auto entry = imMgr.entry(im.name());
        if (!entry)
            continue;
        j.push_back(json_describe_im(entry));
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

EMSCRIPTEN_KEEPALIVE const char *get_all_input_methods() {
    static std::string ret;
    auto j = nlohmann::json::array();
    auto &imMgr = instance->inputMethodManager();
    imMgr.foreachEntries([&j](const fcitx::InputMethodEntry &entry) {
        j.push_back(json_describe_im(&entry));
        return true;
    });
    ret = j.dump();
    return ret.c_str();
}

EMSCRIPTEN_KEEPALIVE const char *get_language_name(const char *code) {
    static std::string name;
    auto entry = isoCodes.entry(code);
    if (!entry) {
        return "";
    }
    name = D_(ISO_639_3_DOMAIN, entry->name);
    return name.c_str();
}
}
} // namespace fcitx
