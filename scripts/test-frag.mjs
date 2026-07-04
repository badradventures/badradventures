import React from "react";
import { renderToString } from "react-dom/server";

const out = renderToString(
  React.createElement("div", { "data-prerender-head": "true" },
    React.createElement(React.Fragment, null,
      React.createElement("title", null, "Test"),
      React.createElement("meta", { name: "description" }),
      React.createElement("link", { rel: "canonical" }),
      React.createElement("script", { type: "application/ld+json", dangerouslySetInnerHTML: { __html: "{}" } })
    )
  )
);
console.log(out);
