#include <emscripten.h>
#include <fcitx-config/configuration.h>
#include <fcitx-config/rawconfig.h>
#include <fcitx-utils/stringutils.h>
#include <fcitx/addonmanager.h>
#include <fcitx/inputmethodengine.h>
#include <fcitx/inputmethodentry.h>
#include <fcitx/inputmethodmanager.h>
#include <fcitx/instance.h>
#include <nlohmann/json.hpp>
#include <string>

namespace fcitx {
extern std::unique_ptr<Instance> instance;

constexpr char globalConfigPath[] = "fcitx://config/global";
constexpr char addonConfigPrefix[] = "fcitx://config/addon/";
constexpr char imConfigPrefix[] = "fcitx://config/inputmethod/";

/// Convert configuration into a json object.
nlohmann::json configToJson(const Configuration &config);

nlohmann::json configValueToJson(const Configuration &config);

using namespace std::literals::string_literals;

static nlohmann::json &jsonLocate(nlohmann::json &j, const std::string &group,
                                  const std::string &option);
static nlohmann::json configValueToJson(const RawConfig &config);
static nlohmann::json configSpecToJson(const RawConfig &config);
static nlohmann::json configSpecToJson(const Configuration &config);
static void mergeSpecAndValue(nlohmann::json &specJson,
                              const nlohmann::json &valueJson);
static RawConfig jsonToRawConfig(const nlohmann::json &);
static std::tuple<std::string, std::string>
parseAddonUri(const std::string &uri);

nlohmann::json getConfig(const std::string &uri) {
    FCITX_DEBUG() << "getConfig " << uri;
    if (uri == globalConfigPath) {
        auto &config = instance->globalConfig().config();
        return configToJson(config);
    } else if (stringutils::startsWith(uri, addonConfigPrefix)) {
        auto [addonName, subPath] = parseAddonUri(uri);
        auto *addonInfo = instance->addonManager().addonInfo(addonName);
        if (!addonInfo) {
            return {{"ERROR", "Addon \""s + addonName + "\" does not exist"}};
        } else if (!addonInfo->isConfigurable()) {
            return {
                {"ERROR", "Addon \""s + addonName + "\" is not configurable"}};
        }
        auto *addon = instance->addonManager().addon(addonName, true);
        if (!addon) {
            return {{"ERROR",
                     "Failed to get config for addon \""s + addonName + "\""}};
        }
        auto *config =
            subPath.empty() ? addon->getConfig() : addon->getSubConfig(subPath);
        if (!config) {
            return {{"ERROR",
                     "Failed to get config for addon \""s + addonName + "\""}};
        }
        return configToJson(*config);
    } else if (stringutils::startsWith(uri, imConfigPrefix)) {
        auto imName = uri.substr(sizeof(imConfigPrefix) - 1);
        auto *entry = instance->inputMethodManager().entry(imName);
        if (!entry) {
            return {
                {"ERROR", "Input method \""s + imName + "\" doesn't exist"}};
        }
        if (!entry->isConfigurable()) {
            return {{"ERROR",
                     "Input method \""s + imName + "\" is not configurable"}};
        }
        auto *engine = instance->inputMethodEngine(imName);
        if (!engine) {
            return {{"ERROR", "Failed to get engine for input method \""s +
                                  imName + "\""}};
        }
        auto *config = engine->getConfigForInputMethod(*entry);
        if (!config) {
            return {{"ERROR", "Failed to get config for input method \""s +
                                  imName + "\""}};
        }
        return configToJson(*config);
    } else {
        return {{"ERROR", "Bad config URI \""s + uri + "\""}};
    }
}

extern "C" {
EMSCRIPTEN_KEEPALIVE const char *get_config(const char *uri) {
    static std::string ret;
    ret = getConfig(std::string(uri)).dump();
    return ret.c_str();
}

EMSCRIPTEN_KEEPALIVE bool set_config(const char *uri_, const char *json_) {
    FCITX_DEBUG() << "setConfig " << uri_;
    auto config = jsonToRawConfig(nlohmann::json::parse(json_));
    auto uri = std::string(uri_);
    if (uri == globalConfigPath) {
        auto &gc = instance->globalConfig();
        gc.load(config, true);
        if (gc.safeSave()) {
            instance->reloadConfig();
            return true;
        } else {
            return false;
        }
    } else if (stringutils::startsWith(uri, addonConfigPrefix)) {
        auto [addonName, subPath] = parseAddonUri(uri);
        auto *addon = instance->addonManager().addon(addonName, true);
        if (addon) {
            FCITX_DEBUG() << "Saving addon config to: " << uri;
            if (subPath.empty()) {
                addon->setConfig(config);
            } else {
                addon->setSubConfig(subPath, config);
            }
            return true;
        } else {
            FCITX_ERROR() << "Failed to get addon";
            return false;
        }
    } else if (stringutils::startsWith(uri, imConfigPrefix)) {
        auto im = uri.substr(sizeof(imConfigPrefix) - 1);
        const auto *entry = instance->inputMethodManager().entry(im);
        auto *engine = instance->inputMethodEngine(im);
        if (entry && engine) {
            FCITX_DEBUG() << "Saving input method config to: " << uri;
            engine->setConfigForInputMethod(*entry, config);
            return true;
        } else {
            FCITX_ERROR() << "Failed to get input method";
            return false;
        }
    } else {
        return false;
    }
}

const char *addon_category_name[] = {"Input Method", "Frontend", "Loader",
                                     "Module", "UI"};

EMSCRIPTEN_KEEPALIVE const char *get_addons() noexcept {
    static std::string ret;
    auto j = nlohmann::json::array();
    for (auto category :
         {fcitx::AddonCategory::Frontend, fcitx::AddonCategory::Loader,
          fcitx::AddonCategory::Module}) {
        auto addons = nlohmann::json::array();
        auto names = instance->addonManager().addonNames(category);
        for (const auto &name : names) {
            const auto *info = instance->addonManager().addonInfo(name);
            if (!info || !info->isConfigurable()) {
                continue;
            }
            addons.push_back(
                nlohmann::json{{"id", info->uniqueName()},
                               {"name", info->name().match()},
                               {"comment", info->comment().match()}});
        }
        if (!addons.empty()) {
            j.push_back({{"id", category},
                         {"name", addon_category_name[(int)category]},
                         {"addons", addons}});
        }
    }
    ret = j.dump();
    return ret.c_str();
}
}

void jsonFillRawConfigValues(const nlohmann::json &j, RawConfig &config) {
    if (j.is_string()) {
        config = j.get<std::string>();
        return;
    }
    if (j.is_object()) {
        for (const auto [key, subJson] : j.items()) {
            auto subConfig = config.get(key, true);
            jsonFillRawConfigValues(subJson, *subConfig);
        }
        return;
    }
    FCITX_FATAL() << "Unknown value json: " << j.dump();
}

RawConfig jsonToRawConfig(const nlohmann::json &j) {
    RawConfig config;
    jsonFillRawConfigValues(j, config);
    return config;
}

nlohmann::json &jsonLocate(nlohmann::json &j, const std::string &groupPath,
                           const std::string &option) {
    auto paths = stringutils::split(groupPath, "$");
    paths.pop_back(); // remove type
    paths.push_back(option);
    nlohmann::json *cur = &j;
    for (const auto &part : paths) {
        auto &children =
            *cur->emplace("Children", nlohmann::json::array()).first;
        bool exist = false;
        for (auto &child : children) {
            if (child["Option"] == part) {
                exist = true;
                cur = &child;
                break;
            }
        }
        if (!exist) {
            cur = &children.emplace_back(nlohmann::json::object());
        }
    }
    return *cur;
}

nlohmann::json configValueToJson(const RawConfig &config) {
    if (!config.hasSubItems()) {
        return nlohmann::json(config.value());
    }
    nlohmann::json j;
    for (auto &subItem : config.subItems()) {
        auto subConfig = config.get(subItem);
        j[subItem] = configValueToJson(*subConfig);
    }
    return j;
}

nlohmann::json configValueToJson(const Configuration &config) {
    RawConfig raw;
    config.save(raw);
    return configValueToJson(raw);
}

nlohmann::json configSpecToJson(const RawConfig &config) {
    // first level  -> Path1$Path2$...$Path_n$ConfigType
    // second level -> OptionName
    nlohmann::json spec;
    auto groups = config.subItems();
    for (const auto &group : groups) {
        auto groupConfig = config.get(group);
        auto options = groupConfig->subItems();
        for (const auto &option : options) {
            auto optionConfig = groupConfig->get(option);
            nlohmann::json &optSpec = jsonLocate(spec, group, option);
            optSpec["Option"] = option;
            optionConfig->visitSubItems(
                [&](const RawConfig &config, const std::string &path) {
                    optSpec[path] = configValueToJson(config);
                    return true;
                });
        }
    }
    return spec;
}

void mergeSpecAndValue(nlohmann::json &specJson,
                       const nlohmann::json &valueJson) {
    if (specJson.find("Type") != specJson.end()) {
        specJson["Value"] = valueJson;
    }
    for (auto &child : specJson["Children"]) {
        const auto iter = valueJson.find(child["Option"]);
        if (iter != valueJson.end()) {
            mergeSpecAndValue(child, *iter);
        }
    }
}

nlohmann::json configSpecToJson(const Configuration &config) {
    RawConfig rawDesc;
    config.dumpDescription(rawDesc);
    return configSpecToJson(rawDesc);
}

nlohmann::json configToJson(const Configuration &config) {
    // specJson contains config definitions
    auto specJson = configSpecToJson(config);
    // valueJson contains actual values that user could change
    auto valueJson = configValueToJson(config);
    mergeSpecAndValue(specJson, valueJson);
    return specJson;
}

static std::tuple<std::string, std::string>
parseAddonUri(const std::string &uri) {
    auto addon = uri.substr(sizeof(addonConfigPrefix) - 1);
    auto pos = addon.find('/');
    if (pos == std::string::npos) {
        return {addon, ""};
    } else {
        return {addon.substr(0, pos), addon.substr(pos + 1)};
    }
}
} // namespace fcitx
