import React, { Component } from 'react';
import PropTypes from 'prop-types';

import { StyleSheet, View } from 'react-native';

export default class LoginScreen extends Component {
    constructor(props){
        super(props);
    }

  render() {
    return (
      <View style={styles.wrapper}>
           <View style={styles.wrapper}>

           </View>
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
