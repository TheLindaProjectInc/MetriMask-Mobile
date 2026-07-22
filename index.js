/**
 * @format
 */
import 'react-native-gesture-handler';
import './shimWrapper.js';

import {AppRegistry} from 'react-native';
import App from './src/rn/MainView';
import {name as appName} from './app.json';

AppRegistry.registerComponent(appName, () => App);
