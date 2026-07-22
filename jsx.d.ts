// @types/react 19 moved the ambient JSX namespace to React.JSX. This project's
// source predates that change and references the bare global `JSX` namespace
// (e.g. `: JSX.Element`) throughout. Re-declare it globally so those
// annotations keep resolving without touching every call site.
import 'react';

declare global {
  namespace JSX {
    type Element = React.JSX.Element;
    type ElementClass = React.JSX.ElementClass;
    type ElementAttributesProperty = React.JSX.ElementAttributesProperty;
    type ElementChildrenAttribute = React.JSX.ElementChildrenAttribute;
    type IntrinsicAttributes = React.JSX.IntrinsicAttributes;
    type IntrinsicClassAttributes<T> = React.JSX.IntrinsicClassAttributes<T>;
    type IntrinsicElements = React.JSX.IntrinsicElements;
  }
}
