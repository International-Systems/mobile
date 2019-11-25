import React from 'react';
import {
    Picker,
    FlatList,
    ActivityIndicator,
    TouchableOpacity,
    Text,
    View,
    StyleSheet,
    Dimensions,
    KeyboardAvoidingView,
    ScrollView,
    PermissionsAndroid,
    AsyncStorage,
    Modal,
    TouchableHighlight
} from 'react-native';

import LoadScreen from './LoadScreen';
import { Ionicons } from '@expo/vector-icons';

//3th parties components
import SearchableDropdown from 'react-native-searchable-dropdown';
import { Actions } from 'react-native-router-flux';

import moment from "moment";
import momentDurationFormatSetup from "moment-duration-format";



export default class SelectBundle extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            isLoading: true,

            menuVisible: false,
            efficiencyVisible: false,
            timerVisible: false,

            currentDate: moment().format("MMMM Do YYYY, h:mm:ss a"),

            efficiency: {},
            employee: props.employee,

            bundles: [],
            operations: [],
            tickets: [],


            bundle: null,
            operation: null,
            ticket: null
        }

        this._selectBundle = this._selectBundle.bind(this);
        this._onPress_Start = this._onPress_Start.bind(this);
        this._onPress_Finish = this._onPress_Finish.bind(this);
    }

    async updateValues() {
        this.setState({
            isLoading: true
        });

        const employee = JSON.parse(await AsyncStorage.getItem("employee"));

        const bundles = JSON.parse(await AsyncStorage.getItem("bundle"));
        const operations = JSON.parse(await AsyncStorage.getItem("operation"));
        const tickets = JSON.parse(await AsyncStorage.getItem("ticket"));

        this.setState({
            isLoading: false,
            employee,
            operations,
            tickets,
            bundles
        });

    }

    componentDidMount() {
        setInterval(() => {
            this.setState({
                currentDate: moment().format("MMMM Do YYYY, h:mm:ss a"),
            })
        }, 1000);

        this.updateValues();

    }

    //MODALS_VISIBLE
    setEfficiencyVisible(visible) {
        this.setState({ efficiencyVisible: visible });
    }

    setMenuVisible(visible) {
        this.setState({ menuVisible: visible });
    }

    setTimerVisible(visible) {
        this.setState({ timerVisible: visible });
    }


    startCountDown() {
        this.setState({ timeCountDown: this.state.ticket.time * 60 });
        this.intervalCountdown = setInterval(
            () => {
                this.setState({ timeCountDown: this.state.timeCountDown - 1 });
            },
            1000
        );
    }

    findTicket() {
        const bundle_obj = this.state.bundle;
        const operation_obj = this.state.operation;

        if (bundle_obj && operation_obj) {

            const bundle = bundle_obj.bundle;
            const operation = operation_obj.operation;
            if (bundle && operation) {
                console.log("SET TICKET:" + bundle + ' - ' + operation);
                this.setState({
                    ticket: this.state.tickets.filter(t => t.bundle == bundle && t.operation == operation)[0]
                });
            }
        }
    }


    async _selectBundle(bundle) {

        await this.setState({
            ticket: null
        });
        //Update is Finished att in operations
        const tk = this.state.tickets;
        const bundle_ops = tk
            .filter(t => t.bundle == bundle.bundle)
            .map(t => (
                {
                    operation: t.operation,
                    isFinished: t.empnum > 0
                }));
        const operations = this.state.operations
            .map(o => {
                const op_bnd = bundle_ops.filter(b => b.operation == o.operation);
                let isFinished = null;
                if (op_bnd.length > 0) {
                    isFinished = op_bnd[0].isFinished;
                }
                return (
                    {
                        ...o,
                        isFinished
                    }
                )
            })
            //ORDER true, false, null
            .sort(function (a, b) { return b.isFinished === null ? -1 : b.isFinished - a.isFinished });




        //Update selected bundle
        const bundles = this.state.bundles.map(b => ({
            ...b,
            isSelected: b.bundle == bundle.bundle
        }));
        await this.setState({
            bundle,
            bundles,
            operations
        });
        this.findTicket();
    }

    async _selectOperation(operation) {

        //Update selected operation
        const operations = this.state.operations.map(o => ({
            ...o,
            isSelected: o.operation == operation.operation
        }));

        await this.setState({
            operation,
            operations
        });

        this.findTicket();
    }

    _onPress_Start() {
        fetch(`${global.hostname}/start_ticket/${this.state.employee.empnum}/${this.state.ticket.ticket}`)
            .then((response) => response.json())
            .then((responseJson) => {
                this.setTimerVisible(true);
                this.startCountDown();
            })
            .catch((error) => {
                console.error(error);
            });
    }

    _onPress_Finish() {
        clearInterval(this.intervalCountdown);

        //STORE DATABASE LOGIC
        fetch(`${global.hostname}/finish_ticket/${this.state.employee.empnum}/${this.state.ticket.ticket}`)
            .then((resIndifferent) => {
                fetch(`${global.hostname}/efficiency_ticket/${this.state.employee.empnum}/${this.state.ticket.ticket}`)
                    .then((response) => response.json())
                    .then((responseJson) => {
                        this.setState({
                            ticket: {
                                ...this.state.ticket,
                                endDate: (new Date()).getTime()
                            },
                            employee: {
                                ...this.state.employee,
                                current_hr_today: ((new Date().getTime() - new Date(this.state.employee.start_timestamp).getTime()) / 3600000)
                            }
                        });
                        let efficiency = responseJson;
                        efficiency["operation"] = this.state.ticket.operation;
                        efficiency["bundle"] = this.state.ticket.bundle;

                        console.log("Time Now:" + new Date());
                        console.log("Hr Start:" + this.state.employee.start_timestamp);
                        console.log("Rate: " + this.state.employee.rate);
                        console.log("Hrs: " + this.state.employee.current_hr_today);


                        this.setState({
                            efficiency,
                            employee: {
                                ...this.state.employee,
                                earn_today: this.state.employee.earn_today + efficiency.earning,
                                salary_today: this.state.employee.rate * this.state.employee.current_hr_today,
                                earn_week: this.state.employee.earn_week + efficiency.earning,
                                salary_week: this.state.employee.salary_week + this.state.employee.rate * this.state.employee.current_hr_today,
                            }
                        });

                        let efficiency_result = {
                            ticket: {
                                day: "$" + parseFloat(this.state.employee.earn_today).toFixed(2),
                                week: "$" + parseFloat(this.state.employee.earn_week).toFixed(2)
                            },
                            hourly: {
                                day: "$" + parseFloat(this.state.employee.salary_today).toFixed(2),
                                week: "$" + parseFloat(this.state.employee.salary_week).toFixed(2)
                            },
                            efficiency: {
                                day: parseFloat((this.state.employee.earn_today / this.state.employee.salary_today) * 100).toFixed(2) + "%",
                                week: parseFloat((this.state.employee.earn_week / this.state.employee.salary_week) * 100).toFixed(2) + "%"
                            },
                            hr_avg: {
                                day: "$" + parseFloat(this.state.employee.earn_today / this.state.employee.current_hr_today).toFixed(2),
                                week: "$" + parseFloat(this.state.employee.earn_week / (this.state.employee.worked_hours_week + this.state.employee.current_hr_today)).toFixed(2)
                            }
                        }

                        //TABLE EFFICIENCY
                        this.setState({
                            tbl_efficiency: {
                                tableHead: ['', 'Day', 'Week'],
                                tableTitle: ['Ticket', 'Hourly', 'Efficiency', 'Hr/Avg'],
                                tableData: [
                                    [efficiency_result.ticket.day, efficiency_result.ticket.week],
                                    [efficiency_result.hourly.day, efficiency_result.hourly.week],
                                    [efficiency_result.efficiency.day, efficiency_result.efficiency.week],
                                    [efficiency_result.hr_avg.day, efficiency_result.hr_avg.week]
                                ]
                            }
                        });

                        this.setTimerVisible(false);
                        this.setEfficiencyVisible(true);
                    });
            })
            .catch((error) => {
                console.error(error);
            });
    }


    render() {
        if (this.state.isLoading || !this.state.operations.length > 0 || !this.state.bundles.length > 0) {
            return (
                <LoadScreen />
            )
        }
        return (
            <View style={{ ...styles.container, backgroundColor: '#000' }}>
                <View style={styles.header}>
                    <TouchableHighlight
                        onPress={() => { this.setMenuVisible(true); }}
                        style={styles.buttonMenu}>
                        <Text style={styles.buttonMenuText}>Menu</Text>
                    </TouchableHighlight>

                    <Modal animationType="slide" transparent={false}
                        visible={this.state.menuVisible}
                        onRequestClose={() => { }}>

                        <View style={styles.container}>
                            <View style={styles.containerItem}>
                                <TouchableHighlight
                                    onPress={() => { this.setMenuVisible(false); }}
                                    style={styles.buttonMenuClose}>
                                    <Text>close</Text>

                                </TouchableHighlight>
                            </View>
                        </View>
                    </Modal>
                </View>
                <View style={{ ...styles.containerItem, backgroundColor: '' }}>
                    <Text style={{ ...styles.titleText, color: 'white' }}>Earnings: {"$" + parseFloat(this.state.employee.earn_today).toFixed(2)}</Text>
                </View>
                <View style={styles.containerContent}>
                    <View style={{ ...styles.containerItem, width: '45%', backgroundColor: '', margin: 10,   height: (Math.round(DEVICE_HEIGHT * 0.3))  }}>
                        <Text style={{ ...styles.titleText, color: 'white' }}>Bundle #</Text>
                        <ScrollView style={styles.contentScroll}>
                            {this.state.bundles.map(b => (
                                <TouchableOpacity style={styles.opBtn} activeOpacity={0.7} onPress={() => this._selectBundle(b)}>
                                    <View style={{ ...styles.opItem, backgroundColor: b.isSelected ? '#90cc55' : '#696969' }}>
                                        <Text style={{ color: '#FFF', margin: 5 }}>
                                            {b.bundle}
                                        </Text>
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>

                    <View style={{ ...styles.containerItem, width: '45%', backgroundColor: '', margin: 10,  height: (Math.round(DEVICE_HEIGHT * 0.3))  }}>
                        <Text style={{ ...styles.titleText, color: 'white' }}>Operation #</Text>
                        <ScrollView style={styles.contentScroll}>
                            {this.state.operations.map(o => (
                                <TouchableOpacity style={styles.opBtn} activeOpacity={0.7} onPress={() => this._selectOperation(o)}>
                                    <View style={{ ...styles.opItem, backgroundColor: o.isSelected ? '#90cc55' : '#696969' }}>
                                        <Text style={{ color: '#FFF', margin: 5 }}>
                                            {o.operation}
                                        </Text>

                                        {o.isFinished === null || o.isFinished === undefined ?
                                            null
                                            :
                                            o.isFinished ?
                                                <Ionicons name="md-checkmark" style={{ alignSelf: 'flex-end', color: '#90cc55' }} size={26}></Ionicons>
                                                :
                                                <Ionicons name="md-arrow-forward" style={{ alignSelf: 'flex-end', color: '#90cc55' }} size={26}></Ionicons>
                                        }
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>

                    <View style={{ ...styles.containerItem, width: '45%', backgroundColor: '', margin: 10 }}>
                        <Text style={{ color: '#FFF' }}>
                            {this.state.ticket ?
                                "Ticket: " + this.state.ticket.ticket
                                :
                                this.state.ticket === 'undefined' ? 'Ticket not found' : 'Select bundle and operation'
                            }
                        </Text>
                    </View>
                    <TouchableOpacity style={{...styles.buttonStart, backgroundColor: this.state.ticket ? '#90cc55' : '#696969'}} onPress={this.state.ticket ? this._onPress_Start : null} activeOpacity={1}>
                        <Text style={styles.textScan} >START</Text>
                    </TouchableOpacity>
                </View>

                {this.state.efficiencyVisible ?
                    <Modal
                        animationType="slide"
                        transparent={false}
                        visible={this.state.efficiencyVisible}
                        onRequestClose={() => {
                            Alert.alert('Modal has been closed.');
                        }}>
                        <View style={{ ...styles.container, justifyContent: 'center', backgroundColor: '#c0c1b0' }}>
                            <View style={styles.containerItem}>
                                <View style={styles.containerItem}>
                                    <Text style={styles.titleTextTimer}>Results</Text>
                                    {this.state.efficiency.efficiency > 0.95 ?
                                        <Text style={styles.titleTextTimer}>Excelent!</Text>
                                        :
                                        this.state.efficiency.efficiency > 0.75 ?
                                            <Text style={styles.titleTextTimer}>Very Good!</Text>
                                            :
                                            <Text style={styles.titleTextTimer}>Warning!</Text>
                                    }

                                    <View style={styles.contentResults}>
                                        <View style={{ width: '40%' }}>
                                            <Text style={styles.titleText}>{this.state.tbl_efficiency.tableTitle[0]}</Text>
                                            <Text style={styles.titleText}>{this.state.tbl_efficiency.tableTitle[1]}</Text>
                                            <Text style={styles.titleText}>{this.state.tbl_efficiency.tableTitle[2]}</Text>
                                            <Text style={styles.titleText}>{this.state.tbl_efficiency.tableTitle[3]}</Text>
                                        </View>
                                        <View style={{ width: '30%' }}>
                                            <Text style={styles.titleText}>{this.state.tbl_efficiency.tableData[0][0]}</Text>
                                            <Text style={styles.titleText}>{this.state.tbl_efficiency.tableData[1][0]}</Text>
                                            <Text style={styles.titleText}>{this.state.tbl_efficiency.tableData[2][0]}</Text>
                                            <Text style={styles.titleText}>{this.state.tbl_efficiency.tableData[3][0]}</Text>
                                        </View>
                                        <View style={{ width: '30%' }}>
                                            <Text style={styles.titleText}>{this.state.tbl_efficiency.tableData[0][1]}</Text>
                                            <Text style={styles.titleText}>{this.state.tbl_efficiency.tableData[1][1]}</Text>
                                            <Text style={styles.titleText}>{this.state.tbl_efficiency.tableData[2][1]}</Text>
                                            <Text style={styles.titleText}>{this.state.tbl_efficiency.tableData[3][1]}</Text>
                                        </View>

                                    </View>




                                </View>
                                <TouchableHighlight
                                    onPress={() => {
                                        this.setEfficiencyVisible(!this.state.efficiencyVisible);
                                    }}
                                    style={styles.buttonModalDone}>
                                    <Text style={styles.textFinishButton}>Done</Text>
                                </TouchableHighlight>
                            </View>
                        </View>
                    </Modal>
                    : null}

                {this.state.timerVisible ?
                    <Modal
                        animationType="slide"
                        transparent={false}
                        visible={this.state.timerVisible}
                        onRequestClose={() => {
                            Alert.alert('Modal has been closed.');
                        }}>
                        <View style={{ ...styles.container, justifyContent: 'center' }}>
                            <Text style={styles.titleTextTimer}> Time </Text>
                            <Text style={styles.contentTextTimer}> {moment.duration(this.state.timeCountDown, "seconds").format()} </Text>

                            <View style={styles.containerItem}>
                                <TouchableOpacity style={styles.buttonFinish}
                                    onPress={this._onPress_Finish}
                                    activeOpacity={1}>
                                    <Text style={styles.textFinishButton} >FINISH</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </Modal>
                    : null}
            </View>
        );
    }
}


const DEVICE_WIDTH = Math.round(Dimensions.get('window').width);
const DEVICE_HEIGHT = Math.round(Dimensions.get('window').height);

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: "center",
        backgroundColor: '#fff',
    },
    containerContent: {
        flexWrap: 'wrap',
        flexDirection: 'row',
        alignItems: "center",
        justifyContent: 'center',
    },
    containerItem: {
        padding: 15,
        borderRadius: 10,
        backgroundColor: 'white',
        alignItems: "center"
    },
    contentResults: {
        flexDirection: 'row',
        alignItems: 'flex-start'
    },
    containerItemAvoid: {
        zIndex: 400
    },
    contentScroll: {
        marginLeft: 10, 
        marginRight: 10, 
      
    },
    header: {
        height: 50,
        width: DEVICE_WIDTH,
        backgroundColor: '#eed514'
    },
    halfScreen: {
        width: '50%',
    },
    emptySpace: {
        height: 300
    },
    titleText: {
        color: 'black',
        fontWeight: 'bold',
        fontSize: 20,
        marginBottom: 10
    },
    buttonMenu: {
        height: '100%'

    },
    buttonMenuText: {
        color: 'white'
    },
    buttonStart: {
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#90cc55',
        fontSize: 30,

        color: 'white',
        height: 50,
        width: '100%'
    },
    buttonFinish: {
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#EE5555',
        fontSize: 40,
        padding: 20,
        color: 'white',
        height: 100,
        width: 300
    },
    buttonModalDone: {
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#110011',
        bottom: 10,

        padding: 20,

        height: 100,
        width: 300
    },
    textFinishButton: {
        fontSize: 40,
        color: 'white',
    },
    textScan: {
        fontSize: 20,
        color: 'white'
    },
    imageBarCode: {
        height: 100,
        width: 100
    },
    titleTextTimer: {
        color: 'black',
        fontWeight: 'bold',
        fontSize: 50,
        marginBottom: 10
    },
    contentTextTimer: {
        color: 'black',
        fontWeight: 'bold',
        fontSize: 50,
        marginBottom: 10
    },
    button: {
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#90cc55',
        height: 40,
        borderRadius: 20,
        zIndex: 100,
    },

    buttonChangeOperation: {
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#4c4d3f',
        borderRadius: 10,
        padding: 20,
        height: 85
    },
    textChangeOperation: {
        fontSize: 15,
        color: 'white'
    },
    loading: {
        width: 24,
        height: 24,
    },
    scrollView: {
        height: "200%"
    },
    opItem: {
        width: Math.round(DEVICE_WIDTH * 0.3),
        borderBottomColor: "#000",
        borderBottomWidth: 5,
        flexDirection: 'row'
    },
    preview: {
        flex: 1,
        justifyContent: 'flex-end',
        alignItems: 'center',
    }
});

