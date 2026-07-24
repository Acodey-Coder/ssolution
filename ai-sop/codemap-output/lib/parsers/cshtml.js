'use strict';
const fs = require('fs');

const MODEL_RE = /@model\s+([\w<>.,\[\]\s]+?)\s*(?:\r?\n|$)/;
const INHERITS_RE = /@inherits\s+([\w<>.,\[\]]+)/;
const USING_RE = /^\s*@using\s+([\w.]+)/gm;
const PARTIAL_CALL_RE = /Html\.(?:Partial|RenderPartial)\(\s*"([^"]+)"/g;
const PARTIAL_TAG_RE = /<partial\s+name="([^"]+)"/g;
const COMPONENT_RE = /@await\s+Component\.InvokeAsync\(\s*"([^"]+)"/g;
const ASP_CONTROLLER_RE = /asp-controller="([^"]+)"/g;
const ASP_ACTION_RE = /asp-action="([^"]+)"/g;
const URL_ACTION_RE = /Url\.Action\(\s*"([^"]+)"\s*(?:,\s*"([^"]+)")?/g;
const HTML_ACTIONLINK_RE = /Html\.ActionLink\([^,]+,\s*"([^"]+)"\s*(?:,\s*"([^"]+)")?/g;

/**
 * Regex-parses a Razor (.cshtml) view: @model/@inherits (view->model link), @using,
 * partial/view-component references (view->view links), and asp-controller/asp-action/
 * Url.Action/Html.ActionLink references (view->controller/action links). Dynamically
 * composed action names (built from variables at runtime) cannot be resolved statically.
 */
function parseCshtml(filePath) {
  let content;
  try {
    content = fs.readFileSync(filePath, 'utf8');
  } catch {
    return null;
  }

  const modelMatch = MODEL_RE.exec(content);
  const inheritsMatch = INHERITS_RE.exec(content);

  const usings = [];
  let m;
  USING_RE.lastIndex = 0;
  while ((m = USING_RE.exec(content))) usings.push(m[1]);

  const partialViews = [];
  PARTIAL_CALL_RE.lastIndex = 0;
  while ((m = PARTIAL_CALL_RE.exec(content))) partialViews.push(m[1]);
  PARTIAL_TAG_RE.lastIndex = 0;
  while ((m = PARTIAL_TAG_RE.exec(content))) partialViews.push(m[1]);

  const viewComponents = [];
  COMPONENT_RE.lastIndex = 0;
  while ((m = COMPONENT_RE.exec(content))) viewComponents.push(m[1]);

  const controllerActionLinks = [];
  ASP_CONTROLLER_RE.lastIndex = 0;
  while ((m = ASP_CONTROLLER_RE.exec(content))) controllerActionLinks.push({ kind: 'asp-controller', controller: m[1] });
  ASP_ACTION_RE.lastIndex = 0;
  while ((m = ASP_ACTION_RE.exec(content))) controllerActionLinks.push({ kind: 'asp-action', action: m[1] });
  URL_ACTION_RE.lastIndex = 0;
  while ((m = URL_ACTION_RE.exec(content))) controllerActionLinks.push({ kind: 'Url.Action', action: m[1], controller: m[2] || null });
  HTML_ACTIONLINK_RE.lastIndex = 0;
  while ((m = HTML_ACTIONLINK_RE.exec(content))) controllerActionLinks.push({ kind: 'Html.ActionLink', action: m[1], controller: m[2] || null });

  return {
    model: modelMatch ? modelMatch[1].trim() : null,
    inherits: inheritsMatch ? inheritsMatch[1].trim() : null,
    usings,
    partialViews,
    viewComponents,
    controllerActionLinks,
  };
}

module.exports = { parseCshtml };
