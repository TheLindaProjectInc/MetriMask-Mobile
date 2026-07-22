// react-native-vector-icons@10 ships Flow types (*.js.flow) but no TypeScript
// declarations for its per-family icon set entry points. Declare the minimal
// shape actually used by this project.
declare module "react-native-vector-icons/MaterialCommunityIcons" {
  import { Component } from "react";
  import { StyleProp, TextStyle } from "react-native";

  export interface IconProps {
    name: string;
    size?: number;
    color?: string;
    style?: StyleProp<TextStyle>;
  }

  export default class MaterialCommunityIcon extends Component<IconProps> {}
}
