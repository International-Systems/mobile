import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Actions } from 'react-native-router-flux';
import {
    AsyncStorage,
    StyleSheet,
    Dimensions,
    View,
    Text,
    TouchableOpacity,
    Modal
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { ScreenOrientation } from 'expo';

export default class LoginScreenNum extends Component {
    constructor(props) {
        super(props);

        /*
            Employee ID receive the employee number to login
            Host  
        */
        this.state = {
            employee: {
                empnum: "",
            },
            host: {
                cloud: 'https://api-international-systems.herokuapp.com',
                local: '192.168.10.10',
                isOnline: undefined,
                isCloud: true
            },
            isLoading: false
        }
        this.changeScreenOrientation();


        this._keyPressed = this._keyPressed.bind(this);
        this._doLogin = this._doLogin.bind(this);
    }

    componentDidMount() {
        this.getStorage();
        this.testConnection();

    }

    async changeScreenOrientation() {
        await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE_LEFT);
    }

    async getStorage() {
        const employee = await AsyncStorage.getItem("employee");
        const host = await AsyncStorage.getItem("host");

        this.setState({
            employee: {
                ...this.state.employee,
                employee: employee ? employee : null
            },
            host: {
                ...this.state.host,
                host: host ? host : null
            }
        });
    }
    async setStorage() {
        await AsyncStorage.setItem('employee', JSON.stringify(this.state.employee));
        await AsyncStorage.setItem('host', JSON.stringify(this.state.host));
    }

    testConnection() {
        this.setState({ isLoading: true });
        global.hostname = this.state.host.isCloud ? this.state.host.cloud : this.state.host.local;
        try {
            this.timeout(
                10000,
                fetch(global.hostname)
            )
                .then((r) => {
                    this.setState({
                        isLoading: false,
                        host: {
                            ...this.state.host,
                            isOnline: true
                        }
                    });

                })
                .catch((error) => {
                    this.setState({
                        isLoading: false,
                        host: {
                            ...this.state.host,
                            isOnline: false
                        }
                    });
                    console.error(error);
                });
        } catch (e) {
            this.setState({
                isLoading: false,
                host: {
                    ...this.state.host,
                    isOnline: false
                }
            });
            console.log(e);
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

    //ACTION FUNCTIONS  
    _keyPressed(num) {
        let empnum = isNaN(num) ? this.state.employee.empnum.slice(0, -1) : this.state.employee.empnum + num;
        this.setState({ employee: { empnum } });
    }

    _doLogin() {
        this.setState({ isLoading: true });
        fetch(`${global.hostname}/employee/${this.state.employee.empnum}`)
            .then((response) => response.json())
            .then(async (employee) => {
                console.log("Employee received");

                this.setState({ isLoading: false });
                if (employee.empnum) {
                    await AsyncStorage.setItem('employee', JSON.stringify(employee));
                    Actions.loadFileScreen({ employee: this.state.employee });
                } else {
                    alert("Invalid user")
                }
            })
            .catch((error) => {
                console.log(error);
                this.setState({ isLoading: false });
                alert("Error: Unable to connect to the server. Try again later.");
            });

    }

    render() {
        return (
            <View style={styles.wrapper}>
                <Modal animationType="fade" transparent={true} visible={this.state.isLoading} >
                    <View style={styles.loadingWrapper}>
                        <Text>Loading</Text>
                    </View>
                </Modal>

                <View style={styles.containerNumber}>
                    <Text style={styles.textNumber}>{this.state.employee.empnum}</Text>
                </View>
                <View style={styles.containerKeyboard}>
                    <TouchableOpacity style={styles.containerKeyboard_Key} activeOpacity={0.2} onPress={() => this._keyPressed(1)}>
                        <Text style={styles.textKeyboard_Key}>1</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.containerKeyboard_Key} activeOpacity={0.2} onPress={() => this._keyPressed(2)}>
                        <Text style={styles.textKeyboard_Key}>2</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.containerKeyboard_Key} activeOpacity={0.2} onPress={() => this._keyPressed(3)}>
                        <Text style={styles.textKeyboard_Key}>3</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.containerKeyboard_Key} activeOpacity={0.2} onPress={() => this._keyPressed(4)}>
                        <Text style={styles.textKeyboard_Key}>4</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.containerKeyboard_Key} activeOpacity={0.2} onPress={() => this._keyPressed(5)}>
                        <Text style={styles.textKeyboard_Key}>5</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.containerKeyboard_Key} activeOpacity={0.2} onPress={() => this._keyPressed(6)}>
                        <Text style={styles.textKeyboard_Key}>6</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.containerKeyboard_Key} activeOpacity={0.2} onPress={() => this._keyPressed(7)}>
                        <Text style={styles.textKeyboard_Key}>7</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.containerKeyboard_Key} activeOpacity={0.2} onPress={() => this._keyPressed(8)}>
                        <Text style={styles.textKeyboard_Key}>8</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.containerKeyboard_Key} activeOpacity={0.2} onPress={() => this._keyPressed(9)}>
                        <Text style={styles.textKeyboard_Key}>9</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.containerKeyboard_Key} activeOpacity={0.2} onPress={() => this._keyPressed("del")}>
                        <Ionicons name="md-backspace" size={Math.round(DEVICE_HEIGHT * 0.1)}></Ionicons>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.containerKeyboard_Key} activeOpacity={0.2} onPress={() => this._keyPressed(0)}>
                        <Text style={styles.textKeyboard_Key}>0</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.containerKeyboard_Key} activeOpacity={0.2} onPress={this._doLogin}>
                        <Ionicons name="md-key" size={Math.round(DEVICE_HEIGHT * 0.1)}></Ionicons>
                    </TouchableOpacity>
                </View>
                <View style={styles.containerStatus}>

                </View>
            </View>
        );
    }
}

const isLandscape = Dimensions.get('window').height < Dimensions.get('window').width;
const DEVICE_WIDTH = Math.round(isLandscape ? Dimensions.get('window').width : Dimensions.get('window').height);
const DEVICE_HEIGHT = Math.round(isLandscape ? Dimensions.get('window').height : Dimensions.get('window').width);


const styles = StyleSheet.create({
    wrapper: {
        flex: 1,
        width: "100%",
        height: "100%",
        resizeMode: 'cover',
        backgroundColor: '#777'

    },
    loadingWrapper: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(100,100,0,0.6)'
    },
    containerNumber: {
        height: '40%',
        padding: 20,
        backgroundColor: '#f5e000',
        alignItems: 'center',
        justifyContent: 'center'
    },
    textNumber: {
        fontSize: 100
    },
    containerKeyboard: {
        flex: 1,
        flexWrap: 'wrap',
        flexDirection: 'row',
        justifyContent: 'space-around',
        width: '100%',
        backgroundColor: '#f5d000',
        height: Math.round(DEVICE_HEIGHT * 0.6)
    },
    containerKeyboard_Key: {
        width: '33%',
        height: Math.round(DEVICE_HEIGHT * 0.6/4),
        alignItems: 'center',
        marginBottom: 2,
        borderRadius: 5,
        justifyContent: 'center',
        backgroundColor: '#ffd500'
    },
    textKeyboard_Key: {
        fontSize: Math.round(DEVICE_HEIGHT * 0.1)
    },
    textKeyboard_Key_2: {
        fontSize: 50
    },
    containerStatus: {

    }
});
