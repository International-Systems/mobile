import React, { Component } from 'react';
import PropTypes from 'prop-types';
import {
  Animated,
  Dimensions,
  StyleSheet,
  KeyboardAvoidingView,
  View,
  Text,
  Easing,
  ActivityIndicator,
  TouchableOpacity,
  TouchableHighlight,
  Image,
  TextInput,
  Modal
} from 'react-native';
import { Actions, ActionConst } from 'react-native-router-flux';

import usernameImg from '../images/username.png';
import passwordImg from '../images/password.png';

import { API_URL } from 'react-native-dotenv';
import { AsyncStorage } from 'react-native';

export default class Form extends Component {
  constructor(props) {
    super(props);
    this.state = {
      modalVisible: false,
      isLoading: false,
      showPass: true,
      press: false,
      error: "",
      isLocal: false,
      isServerOnline: false,
      isCheckingConnection: true,
      hostname: 'https://api-international-systems.herokuapp.com'
    };

    this.buttonAnimated = new Animated.Value(0);
    this.growAnimated = new Animated.Value(0);
    this._onPress = this._onPress.bind(this);
    this.showPass = this.showPass.bind(this);
    global.hostname = 'https://api-international-systems.herokuapp.com';

  }

  componentDidMount() {
    this.checkHost();
    this.loadUser();
  }

  async loadUser() {
    this.setState({
      username: await AsyncStorage.getItem("username"),
      password: await AsyncStorage.getItem("password")
    });
  }

  async checkHost() {

    this.setState({ isServerOnline: false, isCheckingConnection: true });

    if (!this.state.isLocal || !global.hostname || global.hostname.length == 0) {
      try {
        await AsyncStorage.setItem('hostname', 'https://api-international-systems.herokuapp.com');
      } catch (error) {
        // Error saving data
      }
    }

    try {
      this.timeout(
        10000,
        fetch(global.hostname)
      )
        .then((r) => {
          this.setState({
            hostname: global.hostname,
            isServerOnline: true,
            isCheckingConnection: false
          });
        });
    } catch (e) {
      this.setState({
        isServerOnline: false,
        isCheckingConnection: false
      });
      console.log(e);
    }
  }

  async _onPress() {
    if (this.state.isLoading) return;

    this.setState({ isLoading: true });
    Animated.timing(this.buttonAnimated, {
      toValue: 1,
      duration: 200,
      easing: Easing.linear,
    }).start();

    let username = this.state.username;
    let password = "1234";// this.state.password;

    await AsyncStorage.setItem('username', username);
    await AsyncStorage.setItem('password', password);
    if (API_URL == "Offline") {

      //-----------------OFFLINE AUTH--------------
      if (username == "209" && password == "1234") {
        setTimeout(() => {
          this._onGrow();
        }, 2000);

        setTimeout(() => {
          Actions.bundleScreen({ userID: username, modalVisible: false });
          this.setState({ isLoading: false });
          this.buttonAnimated.setValue(0);
          this.growAnimated.setValue(0);
        }, 2500);
      } else {
        this.setState({
          error: "Invalid Password or Username",
          isLoading: false
        });
        Animated.timing(this.buttonAnimated, {
          toValue: 0,
          duration: 200,
          easing: Easing.linear,
        }).start();
      }
    } else {
      const url = `${global.hostname}/auth/?username=${username}&password=${password}`;
      try {
        this.timeout(
          10000,
          fetch(url)
        )
          .then((response) => response.json())
          .then((responseJson) => {

            if (responseJson) {
              setTimeout(() => {
                this._onGrow();
              }, 2000);

              setTimeout(() => {
                Actions.bundleScreen({ userID: username, modalVisible: false });
                this.setState({ isLoading: false });
                this.buttonAnimated.setValue(0);
                this.growAnimated.setValue(0);
              }, 2500);
            } else {
              this.setState({
                error: "Invalid Password or Username",
                isLoading: false
              });
              Animated.timing(this.buttonAnimated, {
                toValue: 0,
                duration: 200,
                easing: Easing.linear,
              }).start();
            }
          })
          .catch((error) => {

            this.setState({
              error: error,
              isLoading: false
            });
            Animated.timing(this.buttonAnimated, {
              toValue: 0,
              duration: 200,
              easing: Easing.linear,
            }).start();
          });
      }
      catch (e) {
        this.setState({
          error: error,
          isLoading: false
        });
        Animated.timing(this.buttonAnimated, {
          toValue: 0,
          duration: 200,
          easing: Easing.linear,
        }).start();
      }

    }

  }

  timeout(ms, promise) {
    return new Promise(function (resolve, reject) {
      setTimeout(function () {
        reject("Unable to connect to the server")
      }, ms);
      promise.then(resolve, reject)
    })
  }


  _onGrow() {
    Animated.timing(this.growAnimated, {
      toValue: 1,
      duration: 200,
      easing: Easing.linear,
    }).start();
  }

  showPass() {
    this.state.press === false
      ? this.setState({ showPass: false, press: true })
      : this.setState({ showPass: true, press: false });
  }

  render() {
    const changeWidth = this.buttonAnimated.interpolate({
      inputRange: [0, 1],
      outputRange: [DEVICE_WIDTH - MARGIN, MARGIN],
    });
    const changeScale = this.growAnimated.interpolate({
      inputRange: [0, 1],
      outputRange: [1, MARGIN],
    });
    return (
      <KeyboardAvoidingView behavior="padding" style={styles.container}>
        <View style={styles.inputWrapper}>
          <Image source={usernameImg} style={styles.inlineImg} />
          <TextInput
            style={styles.input}
            placeholder="Username"
            secureTextEntry={false}
            autoCorrect={false}
            autoCapitalize={'none'}
            returnKeyType={'done'}
            placeholderTextColor="white"
            underlineColorAndroid="transparent"
            ref={(el) => { this.username = el; }}
            onChangeText={(username) => this.setState({ username })}
            value={this.state.username}
          />
        </View>
        {/* <View style={styles.inputWrapper}>
          <Image source={passwordImg} style={styles.inlineImg} />

          <TextInput
            style={styles.input}
            placeholder="Password"
            secureTextEntry={this.state.showPass}
            autoCorrect={false}
            autoCapitalize={'none'}
            returnKeyType={'done'}
            placeholderTextColor="white"
            underlineColorAndroid="transparent"
            ref={(el) => { this.password = el; }}
            onChangeText={(password) => this.setState({ password })}
            value={this.state.password}
          />
        </View> */}
        <View sytle={styles.error}>
          <Text style={{ color: 'red', padding: 10 }}>
            {this.state.error}
          </Text>
        </View>

        <View style={styles.container}>
          <Animated.View style={{ width: changeWidth }}>
            <TouchableOpacity style={styles.button} onPress={this._onPress} activeOpacity={1}>
              {
                this.state.isLoading ?
                  (
                    <Text style={styles.loading}></Text>
                  )
                  :
                  (
                    <Text style={styles.text}>LOGIN</Text>
                  )
              }
            </TouchableOpacity>
            <Animated.View style={[styles.circle, { transform: [{ scale: changeScale }] }]} />
          </Animated.View>

        </View>
        <View style={styles.container}>
          <TouchableOpacity onPress={() => this.setState({ modalVisible: true })} activeOpacity={1} >
            {this.state.isCheckingConnection ?
              <Text style={{ color: 'white' }}>Checking connection...</Text>
              :
              !this.state.isServerOnline ?
                <Text style={{ color: 'white' }}>Offline</Text>
                :
                this.state.isLocal ?
                  <Text style={{ color: 'white' }}>Connected to: {global.hostname}</Text>
                  :
                  <Text style={{ color: 'white' }}>Online</Text>
            }
          </TouchableOpacity>
        </View>

        <Modal
          animationType="slide"
          transparent={false}
          visible={this.state.modalVisible}
        >

          <View style={styles.modal}>
            <TextInput
              style={styles.inputConfig}
              placeholder=""
              secureTextEntry={false}
              autoCorrect={false}
              autoCapitalize={'none'}
              returnKeyType={'done'}
              placeholderTextColor="white"
              underlineColorAndroid="transparent"
              ref={(el) => { this.hostname = el; }}
              onChangeText={(hostname) => this.setState({ hostname })}
              value={this.state.hostname}
            />

            <TouchableHighlight
              onPress={async () => {
                this.setState({ modalVisible: false });
                global.hostname = this.state.hostname;
                await AsyncStorage.setItem('hostname', global.hostname);
                this.checkHost();
              }}
              style={styles.buttonModalSave}>
              <Text style={styles.text}>Save</Text>
            </TouchableHighlight>

          </View>
        </Modal>
      </KeyboardAvoidingView>
    );
  }
}

const DEVICE_WIDTH = Dimensions.get('window').width;
const DEVICE_HEIGHT = Dimensions.get('window').height;
const MARGIN = 40;

const styles = StyleSheet.create({
  container: {
    flex: 3,
    alignItems: 'center',
  },
  containerInput: {
    flex: 1,
    top: 0,
    alignItems: 'center',
    justifyContent: 'flex-start',

  },
  btnEye: {
    position: 'absolute',
    top: 75,
    right: 28,
  },
  iconEye: {
    width: 25,
    height: 25,
    tintColor: 'rgba(0,0,0,0.2)',
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    width: DEVICE_WIDTH - 40,
    height: 40,
    marginHorizontal: 20,
    paddingLeft: 45,
    borderRadius: 20,
    color: '#ffffff',
  },
  inputWrapper: {
    flex: 1,
  },
  inlineImg: {
    position: 'absolute',
    zIndex: 99,
    width: 22,
    height: 22,
    left: 35,
    top: 9,
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#90cc55',
    height: MARGIN,
    borderRadius: 20,
    zIndex: 100,
  },
  circle: {
    height: MARGIN,
    width: MARGIN,
    marginTop: -MARGIN,
    borderWidth: 1,
    borderColor: '#90cc55',
    borderRadius: 100,
    alignSelf: 'center',
    zIndex: 99,
    backgroundColor: '#90cc55',
  },
  text: {
    color: 'white',
    backgroundColor: 'transparent',
  },
  loading: {
    width: 24,
    height: 24,
  },
  error: {
    color: 'red',
    padding: 10
  },
  modal: {
    flex: 1,
    width: DEVICE_WIDTH,
    height: DEVICE_HEIGHT,
    resizeMode: 'cover',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#838373'
  },
  buttonModalSave: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#90cc55',
    marginTop: 20,
    borderRadius: 20,
    height: 40,
    width: 200
  },
  inputConfig: {
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    width: DEVICE_WIDTH - 40,
    height: 40,
    marginHorizontal: 20,
    paddingLeft: 45,
    borderRadius: 20,
  }
});
