import React from 'react';
import { View, StyleSheet,Text, Image } from 'react-native';
import { ExpoLinksView } from '@expo/samples';

import logoImg from '../images/logo_trans.png';

export default function LinksScreen() {
  return (
    <View style={styles.container}>
     <Image source={logoImg} style={styles.image} />
     <Text>Loading...</Text>
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 15,
    backgroundColor: '#FFD500',
    alignContent:'center',
    alignItems:'center',
    justifyContent:'center'
 },
 image: {
   width: 80,
   height: 80,
 },
});
