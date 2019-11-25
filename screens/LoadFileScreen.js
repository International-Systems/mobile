import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Actions } from 'react-native-router-flux';
import {
    AsyncStorage,
    StyleSheet,
    View,
    Image,
    Text,
    TouchableOpacity,
    Modal
} from 'react-native';

import logoImg from '../images/logo_trans.png';



export default class LoginScreenNum extends Component {
    constructor(props) {
        super(props);

        this.state = {
            employee: props.employee,
            isLoadingEmployee: true,
            isLoadingBundle: true,
            isLoadingTicket: true,
            isLoadingOperation: true
        }

    }


    componentDidMount(){
        this.updateBundle();
        this.updateTicket();
        this.updateOperation();
        this.updateEmployee();

    }


    async updateBundle() {
        fetch(`${global.hostname}/bundle`)
            .then((response) => response.json())
            .then(async (responseJson) => {
                await AsyncStorage.setItem('bundle', JSON.stringify(responseJson));
                await this.setState({
                    isLoadingBundle: false
                });
                this.redirect();
            })
            .catch(async (error) => {
                console.error(error);
                await this.setState({
                    isLoadingBundle: false
                });
                this.redirect();
            });
    }


    async updateTicket() {
        fetch(`${global.hostname}/ticket`)
            .then((response) => response.json())
            .then(async (responseJson) => {
                await AsyncStorage.setItem('ticket', JSON.stringify(responseJson));
                await this.setState({
                    isLoadingTicket: false
                });
                this.redirect();
            })
            .catch(async (error) => {
                console.error(error);
                await this.setState({
                    isLoadingTicket: false
                });
                this.redirect();
            });
    }


    async updateOperation() {
        fetch(`${global.hostname}/operation`)
            .then((response) => response.json())
            .then(async (responseJson) => {
                await AsyncStorage.setItem('operation', JSON.stringify(responseJson));
                await this.setState({
                    isLoadingOperation: false
                });
                this.redirect();
            })
            .catch(async (error) => {
                console.error(error);
                await this.setState({
                    isLoadingOperation: false
                });
                this.redirect();
            });
    }

    async updateEmployee() {
        fetch(`${global.hostname}/employee/${this.state.employee.empnum}`)
            .then((response) => response.json())
            .then(async (responseJson) => {
                await AsyncStorage.setItem('employee', JSON.stringify(responseJson));
                await this.setState({
                    isLoadingEmployee: false
                });
                this.redirect();
            })
            .catch(async (error) => {
                console.error(error);
                await this.setState({
                    isLoadingEmployee: false
                });
                this.redirect();
            });
    }

    redirect() {
        const isLoading = 
        this.state.isLoadingEmployee ||
        this.state.isLoadingBundle ||
        this.state.isLoadingTicket ||
        this.state.isLoadingOperation;

        if (!isLoading) {
            Actions.selectBundleScreen();
        }
    }

    render() {
        return (
            <View style={styles.container}>
                <Image source={logoImg} style={styles.image} />
                {this.state.isLoadingEmployee ?
                    <Text>Employee profile ...</Text>
                    :
                    <Text>Employee profile OK</Text>
                }
                {this.state.isLoadingBundle ?
                    <Text>Bundles ...</Text>
                    :
                    <Text>Bundles OK</Text>
                }
                {this.state.isLoadingOperation ?
                    <Text>Operations ...</Text>
                    :
                    <Text>Operations OK</Text>
                }
                {this.state.isLoadingTicket ?
                    <Text>Tickets ...</Text>
                    :
                    <Text>Tickets OK</Text>
                }
            </View>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: 15,
        backgroundColor: '#FFD500',
        alignContent: 'center',
        alignItems: 'center',
        justifyContent: 'center'
    },
    image: {
        width: 80,
        height: 80,
    },
});
