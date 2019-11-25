import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Logo from '../components/Logo';
import Form from '../components/Form';
import { StyleSheet, View } from 'react-native';

export default class LoginScreen extends Component {
  render() {
    return (
      <View style={styles.wrapper}>
        <Logo />
        <Form />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    width: null,
    height: null,
    resizeMode: 'cover',
    backgroundColor: '#777'

  },
});
