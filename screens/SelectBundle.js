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
import { ScreenOrientation } from 'expo';

//3th parties components
import SearchableDropdown from 'react-native-searchable-dropdown';
import { Actions } from 'react-native-router-flux';

import moment from "moment";
import momentDurationFormatSetup from "moment-duration-format";

let renderTime = 0;

export default class SelectBundle extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            isLoading: true,
            isSyncOperations: false,
            version: '0.1.0',
            syncBG: {
                lastDate: new Date(),
                isSyncTickets: false,
                isSyncBundles: false
            },

            menuVisible: false,
            efficiencyVisible: false,
            timerVisible: false,

            currentDate: new Date(),
            startDateAdjust: new Date(),
            diffTime: 0,
            timerUpdateDate: null,

            efficiency: {},
            employee: props.employee,

            chuckSize: 20,
            currentChuck: 0,
            startListBundles: 0,
            endListBundles: 20,


            complete_bundles: [],
            tickets_pending: [],

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
        this._sliceBundle = this._sliceBundle.bind(this);
    }

    componentDidMount() {
        this.setState({
            timerUpdateDate: setInterval(() => this.updateCurrentTime(), 1000)
        });

        this.updateValues(false);
        this.changeScreenOrientation();
    }



    getOperations(bundle) {
        this.setState({
            isSyncOperations: true
        });
        fetch(`${global.hostname}/particle/bundle/${bundle.id}`)
            .then((response) => response.json())
            .then(async (operations) => {
                bundle = { ...bundle, operations };
                const complete_bundles = this.state.complete_bundles.map(b => b.id == bundle.id ? bundle : b);
                await AsyncStorage.setItem('complete_bundles', JSON.stringify(complete_bundles));
                this.updateValues(true);
                this._selectBundle(bundle);

                this.setState({
                    isSyncOperations: false
                });
            })
            .catch(async (error) => {
                console.error(error);
            });
    }

    async updateValues(isBackground) {
        if (!isBackground) {
            await this.setState({
                isLoading: true
            });
        }
        const employee = JSON.parse(await AsyncStorage.getItem("employee"));
        let complete_bundles = JSON.parse(await AsyncStorage.getItem("complete_bundles"));
        if (this.state.bundle && isBackground) {
            complete_bundles = complete_bundles.map(b => ({
                ...b,
                isSelected: b.id == this.state.bundle.id,
                operations: b.operations.map(o => ({
                    ...o,
                    isSelected: o.id == this.state.operation
                }))
            }));
        }
        
        await this.setState({
            isLoading: false,
            employee,
            complete_bundles
        });

    }


    updateCurrentTime() {
        const currentDate = new Date();
        const startTime = new Date(this.state.employee.start_timestamp);
        const diffTime = currentDate.getTimezoneOffset();
        let startTimeDateAdjust = startTime.getTime() + (diffTime * 60 * 1000);
        startTimeDateAdjust = startTimeDateAdjust - (currentDate < startTimeDateAdjust ? 86400000 : 0);
        const startDateAdjust = new Date(startTimeDateAdjust);
        const current_hr_today = (currentDate.getTime() - startTimeDateAdjust) / 3600000;

        this.setState({
            currentDate,
            startDateAdjust,
            diffTime,
            employee: {
                ...this.state.employee,
                current_hr_today,
                salary_today: current_hr_today * this.state.employee.rate
            }
        });
    }

    async changeScreenOrientation() {
        await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE_LEFT);
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

    async syncServer() {
        console.log(new Date() + ": 1 Sync Server");
        this.sendTickets();

    }

    async sendTickets() {
        const tickets_pending = JSON.parse(await AsyncStorage.getItem('tickets_pending'));

        const tickets_finished = tickets_pending.filter(t => t.end_time);

        if (tickets_finished.length > 0) {
            fetch(`${global.hostname}/scans`, {
                method: 'POST', // *GET, POST, PUT, DELETE, etc.
                mode: 'cors', // no-cors, *cors, same-origin
                cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
                credentials: 'same-origin', // include, *same-origin, omit
                headers: {
                    'Content-Type': 'application/json'
                },
                redirect: 'follow',
                referrer: 'no-referrer',
                body: JSON.stringify(tickets_finished)
            }).then((r) => {
                const _tickets_pending = tickets_pending.filter(t => tickets_finished.filter(f => f.ticket == t.ticket).length == 0);
                AsyncStorage.setItem('tickets_pending', JSON.stringify(_tickets_pending));
                this.setState({
                    tickets_pending: _tickets_pending,
                    syncBG: {
                        ...this.state.syncBG,
                        lastDate: new Date(),
                        isSyncTickets: true
                    }
                });
            })
                .catch(e => alert("Error connecting to the server."))
        }
    }

    async updateBundle() {
        if (this.state.syncBG.isSyncBundles) {

        } else {
            await this.setState({
                syncBG: {
                    isSyncBundles: true
                }
            });
            fetch(`${global.hostname}/complete/bundle`)
                .then((response) => response.json())
                .then(async (responseJson) => {
                    await AsyncStorage.setItem('complete_bundles', JSON.stringify(responseJson));

                    this.setState({
                        syncBG: {
                            ...this.state.syncBG,
                            lastDate: new Date(),
                            isSyncBundles: false
                        }
                    });
                    this.updateValues(true);
                })
                .catch(async (error) => {
                    console.error(error);
                });
        }
    }


    isCloseToBottom = ({ layoutMeasurement, contentOffset, contentSize }) => {
        const paddingToBottom = ((this.state.complete_bundles.length - 1) * itemScrollSize) - (itemScrollSize * this.state.currentChuck);
        return layoutMeasurement.height + contentOffset.y >=
            contentSize.height - paddingToBottom;
    };

    isCloseToTop = ({ contentOffset }) => {
        const paddingToTop = (itemScrollSize * this.state.chuckSize * this.state.currentChuck) + itemScrollSize

        return contentOffset.y - paddingToTop <= 0;
    };


    async selectOperation() {
        let bundle = this.state.bundle;
        const tickets = bundle.operations.filter(o => o.id == this.state.operation)[0];
        const ticket = tickets ? tickets.ticket : null;

        bundle.operations = this.state.bundle.operations.map(o => ({
            ...o,
            isSelected: o.id == this.state.operation
        }));
        this.setState({
            bundle,
            ticket
        });
    }


    //SCREEEN ACTIONS
    async _selectBundle(bundle) {
        if (bundle.operations.length == 0) {
            this.getOperations(bundle);
            return;
        }
        //Update selected bundle
        const complete_bundles = this.state.complete_bundles.map(b => ({
            ...b,
            isSelected: b.id == bundle.id,
            operations: b.operations.map(o => ({
                ...o,
                isSelected: o.id == this.state.operation
            }))
        }));
        await this.setState({
            bundle,
            complete_bundles
        });
        this.selectOperation();
    }


    async _selectOperation(operation) {
        //Not allow to start ticket if finished
        if (operation.isFinished) {
            alert("Ticket finished");
            return;
        }
        await this.setState({
            operation: operation.id
        });
        this.selectOperation();
    }

    _onPress_Start() {
        if (this.state.ticket === null) {
            return;
        }

        this.setTimerVisible(true);
        this.startCountDown();
        const tickets_pending = this.state.tickets_pending;
        tickets_pending.push({
            empnum: this.state.employee.empnum,
            ticket: this.state.ticket.id,
            start_time: new Date().toISOString()
        });
        this.setState({
            tickets_pending
        })
    }

    async onPress_Finish() {
        if (this.state.ticket === null) {
            return;
        }
        const ticketID = this.state.ticket.id;

        this.setState({
            ticket: null
        })

        //Update queue for tickets
        const tickets_pending = this.state.tickets_pending.filter(t => t.ticket != ticketID);
        const ticket = this.state.tickets_pending.filter(t => t.ticket == ticketID)[0];
        tickets_pending.push({
            ...ticket,
            end_time: new Date().toISOString()
        });

        const employee = {
            ...this.state.employee,
            earn_today: this.state.employee.earn_today + this.state.ticket.earn
        };

        //mark ticket as finished
        let bundle = this.state.bundle;
        bundle = {
            ...bundle,
            isSelected: true,
            operations: bundle.operations.map(o => o.id == this.state.operation ? { ...o, isFinished: true } : o)
        }
        const complete_bundles = this.state.complete_bundles.map(b => b.id == bundle.id ? bundle : b)
        // console.log(complete_bundles);
        await this.setState({
            bundle,
            complete_bundles,
            tickets_pending,
            employee
        });

        await AsyncStorage.setItem('complete_bundles', JSON.stringify(complete_bundles));
        await AsyncStorage.setItem('employee', JSON.stringify(employee));
        await AsyncStorage.setItem('tickets_pending', JSON.stringify(tickets_pending));
        this.syncServer();
    }

    _onPress_Finish() {
        // console.log(new Date() +  ": Start finishTicket" );
        this.setTimerVisible(false);
        // console.log(new Date() +  ": 1 finishTicket" );
        clearInterval(this.intervalCountdown);
        // console.log(new Date() +  ": 2 finishTicket" );
        this.onPress_Finish();
        //    console.log(new Date() +  ": 3 finishTicket" );
    }

    async _onPress_Logout() {
        Actions.loginScreen();
    }


    async _sliceBundle(isDown) {


        let startListBundles = this.state.endListBundles - (this.state.chuckSize * 3) - (this.state.chuckSize * isDown);
        startListBundles = startListBundles < 0 ? 0 : startListBundles;

        let endListBundles = this.state.endListBundles + (this.state.chuckSize * isDown)

        //avoid slice bigger than list
        endListBundles = endListBundles > this.state.complete_bundles.length ? this.state.complete_bundles.length : endListBundles;

        console.log("----------------------------");
        console.log("Start: " + startListBundles);
        console.log("Finish: " + endListBundles);


        await this.setState({
            startListBundles,
            endListBundles,
            currentChuck: this.state.currentChuck + isDown
        })
    }

    render() {
        if (this.state.isLoading || !this.state.complete_bundles.length > 0) {
            return (
                <LoadScreen />
            )
        }
        return (
            <View style={styles.container}>
                <View style={styles.containerContent}>
                    <View style={styles.containerHeader}>
                        <Text style={styles.textEarning}>Version:{this.state.version}  Emp.: {this.state.employee.empnum} - Name: {this.state.employee.firstname + " " + this.state.employee.lastname}</Text>
                    </View>

                    <View style={{ ...styles.containerItem, backgroundColor: '#1F1F1F', borderRadius: 5, borderWidth: 2, borderColor: '#7F7F7F' }}>
                        <Text style={{ ...styles.textEarning, fontWeight: 'bold', textAlign: 'center' }}>{this.state.currentDate.toLocaleString()}</Text>
                        <TouchableOpacity style={styles.buttonLogout}
                            onPress={this._onPress_Logout}
                            activeOpacity={1}>
                            <Ionicons name="md-arrow-dropleft" style={{ color: '#C9C9C9' }} size={26}></Ionicons>
                            <Text style={{ ...styles.textEarning, color: '#C9C9C9', width: null, height: '100%', textAlign: 'center', textAlignVertical: "center" }}>Logout</Text>
                        </TouchableOpacity>
                        <Text style={styles.textEarning}>Start: {this.state.employee.start_time}</Text>
                        <Text style={styles.textEarning}>Finish: {this.state.employee.finish_time}</Text>
                        <Text style={styles.textEarning}>Weekly Goal: {"$" + parseFloat(this.state.employee.wk_goal).toFixed(2)}</Text>
                       
                    </View>
                    <View style={{ ...styles.containerItem, width: Math.round(DEVICE_WIDTH * 0.6), backgroundColor: '' }}>

                        <View style={{ width: Math.round(DEVICE_WIDTH * 0.13), backgroundColor: '#292929', color: '#292929' }} >
                            <Text style={{ ...styles.textEarning, fontWeight: 'bold', textAlign: 'center', backgroundColor: '#292929'}}>Wk.Goal %</Text>
                            <Text style={{ ...styles.textEarning, backgroundColor: '#292929', fontSize: 20, fontWeight: 'bold'}}>{parseFloat(((this.state.employee.total_hours * ((this.state.employee.earn_week + this.state.employee.earn_today) / (this.state.employee.worked_hours_week + this.state.employee.current_hr_today))) / this.state.employee.wk_goal) * 100).toFixed(2) + "%"}</Text>
                            <Text style={{ ...styles.textEarning, backgroundColor: '#292929', color: '#292929' }}>-</Text>
                            {(this.state.employee.earn_today / this.state.employee.salary_today) > 0.95 ?
                                <Text style={{ ...styles.textEarning, fontWeight: 'bold', textAlign: 'center', alignItems: 'center', color: '#90Fc55' }}>Excelent!</Text>
                                :
                                (this.state.employee.earn_today / this.state.employee.salary_today) > 0.75 ?
                                    <Text style={{ ...styles.textEarning, fontWeight: 'bold', textAlign: 'center', alignItems: 'center', color: '#70cc33' }}>Very Good!</Text>
                                    :
                                    <Text style={{ ...styles.textEarning, fontWeight: 'bold', textAlign: 'center', alignItems: 'center', color: '#F90f0f' }}>Warning!</Text>
                            }
                            <Text style={{ ...styles.textEarning, backgroundColor: '#292929', color: '#292929' }}>-</Text>

                        </View>

                        <View style={{ width: Math.round(DEVICE_WIDTH * 0.13) }} >
                            <Text style={{ ...styles.textEarning, fontWeight: 'bold', textAlign: 'center', backgroundColor: '#292929', color: '#292929' }}>-</Text>
                            <Text style={{ ...styles.textEarning, backgroundColor: '#69696A' }}>Ticket</Text>
                            <Text style={{ ...styles.textEarning, backgroundColor: '#39393A' }}>Hourly</Text>
                            <Text style={{ ...styles.textEarning, backgroundColor: '#69696A' }}>Efficiency</Text>
                            <Text style={{ ...styles.textEarning, backgroundColor: '#39393A' }}>Hr/Avg</Text>
                        </View>
                        <View style={{ width: Math.round(DEVICE_WIDTH * 0.15) }} >
                            <Text style={{ ...styles.textEarning, fontWeight: 'bold', textAlign: 'center', backgroundColor: '#393939' }}>Daily</Text>
                            <Text style={{ ...styles.textEarning, backgroundColor: '#696969' }}>{"$" + parseFloat(this.state.employee.earn_today).toFixed(2)}</Text>
                            <Text style={{ ...styles.textEarning, backgroundColor: '#393939' }}>{"$" + parseFloat(this.state.employee.salary_today).toFixed(2)}</Text>
                            <Text style={{ ...styles.textEarning, backgroundColor: '#696969' }}>{parseFloat((this.state.employee.earn_today / this.state.employee.salary_today) * 100).toFixed(2) + "%"}</Text>
                            <Text style={{ ...styles.textEarning, backgroundColor: '#393939' }}>{"$" + parseFloat(this.state.employee.earn_today / this.state.employee.current_hr_today).toFixed(2)}</Text>
                        </View>
                        <View style={{ width: Math.round(DEVICE_WIDTH * 0.15) }} >
                            <Text style={{ ...styles.textEarning, fontWeight: 'bold', textAlign: 'center', backgroundColor: '#393939' }}>Weekly</Text>
                            <Text style={{ ...styles.textEarning, backgroundColor: '#696969' }}>{"$" + parseFloat(this.state.employee.earn_week + this.state.employee.earn_today).toFixed(2)}</Text>
                            <Text style={{ ...styles.textEarning, backgroundColor: '#393939' }}>{"$" + parseFloat(this.state.employee.salary_week + this.state.employee.salary_today).toFixed(2)}</Text>
                            <Text style={{ ...styles.textEarning, backgroundColor: '#696969' }}>{parseFloat(((this.state.employee.earn_week + this.state.employee.earn_today) / (this.state.employee.salary_week + this.state.employee.salary_today)) * 100).toFixed(2) + "%"}</Text>
                            <Text style={{ ...styles.textEarning, backgroundColor: '#393939' }}>{"$" + parseFloat((this.state.employee.earn_week + this.state.employee.earn_today)/ (this.state.employee.worked_hours_week + this.state.employee.current_hr_today)).toFixed(2)}</Text>
                        </View>
                    </View>

                    <View style={{ ...styles.containerItem, height: Math.round(DEVICE_HEIGHT * 0.5) }}>
                        <Text style={{ ...styles.titleText, color: 'white' }}>Bundle {this.state.bundle ? this.state.bundle.id : '#'}</Text>

                        <ScrollView style={styles.contentScroll}
                        // onScroll={({ nativeEvent }) => {
                        //     if (this.isCloseToBottom(nativeEvent)) {
                        //         this._sliceBundle(1)
                        //     } else {
                        //         if (this.isCloseToTop(nativeEvent) && this.state.startListBundles > 0 ) {
                        //             this._sliceBundle(-1)

                        //         }
                        //     }
                        // }}
                        // scrollEventThrottle={40}
                        >
                            {this.state.startListBundles > 0 ?
                                // <View style={{ ...styles.opItem, backgroundColor: '', height: (itemScrollSize  * this.state.chuckSize * this.state.currentChuck )  }}>

                                // </View>

                                <TouchableOpacity style={styles.opBtn} activeOpacity={0.7} onPress={() => this._sliceBundle(-1)}>
                                    <View style={{ ...styles.opItem, backgroundColor: '', height: (itemScrollSize * 2) }} >
                                        <Text style={{ color: '#FFF', margin: 5 }}>
                                            ...
                                        </Text>
                                    </View>
                                </TouchableOpacity>

                                :
                                null
                            }

                            {this.state.complete_bundles.slice(this.state.startListBundles, this.state.endListBundles).map(b => (
                                <TouchableOpacity key={b.id} style={styles.opBtn} activeOpacity={0.7} onPress={() => this._selectBundle(b)} >
                                    <View style={{ ...styles.opItem, backgroundColor: b.isSelected ? '#70cc33' : '#696969' }}>
                                        <Text style={{ color: '#FFF', margin: 5 }}>
                                            {b.id}
                                        </Text>
                                    </View>
                                </TouchableOpacity>
                            ))}
                            {/* <View style={{ ...styles.opItem, backgroundColor: '', height: (this.state.complete_bundles.length * itemScrollSize) - (itemScrollSize * this.state.currentChuck) }}>

                            </View> */}
                            <TouchableOpacity style={styles.opBtn} activeOpacity={0.7} onPress={() => this._sliceBundle(1)}>
                                <View style={{ ...styles.opItem, backgroundColor: '', height: (itemScrollSize * 2) }} >
                                    <Text style={{ color: '#FFF', margin: 5 }}>
                                        ...
                                    </Text>
                                </View>
                            </TouchableOpacity>

                        </ScrollView>
                    </View>

                    <View style={{ ...styles.containerItem, height: Math.round(DEVICE_HEIGHT * 0.5) }}>
                        <Text style={{ ...styles.titleText, color: 'white' }}>Operation {this.state.operation ? this.state.operation : '#'}</Text>
                        {this.state.isSyncOperations ?
                            <View style={{ ...styles.contentScroll, justifyContent: 'center', alignItems: 'center' }}>
                                <Ionicons name="md-walk" style={{ color: '#FFF' }} size={50}></Ionicons>
                            </View>
                            :

                            <ScrollView style={styles.contentScroll}>
                                {this.state.bundle ? this.state.bundle.operations.filter(o => !(o.isFinished === undefined || o.isFinished === null)).map(o => (
                                    <TouchableOpacity key={o.id} style={styles.opBtn} activeOpacity={0.7} onPress={() => this._selectOperation(o)}>
                                        <View style={{ ...styles.opItem, backgroundColor: o.isSelected ? '#70cc33' : '#696969' }}>
                                            <Text style={{ color: '#FFF', margin: 5 }}>
                                                {o.id}
                                            </Text>
                                            {o.isFinished === null || o.isFinished === undefined ?
                                                null
                                                :
                                                o.isFinished ?
                                                    <Ionicons name="md-checkmark" style={{ alignSelf: 'flex-end', color: '#70cc33' }} size={26}></Ionicons>
                                                    :
                                                    <Ionicons name="md-arrow-forward" style={{ alignSelf: 'flex-end', color: '#70cc33' }} size={26}></Ionicons>
                                            }
                                        </View>
                                    </TouchableOpacity>
                                )) : null}
                            </ScrollView>
                        }
                    </View>

                    <View style={{ ...styles.containerItem, height: Math.round(DEVICE_HEIGHT * 0.5), padding: 10 }}>
                        {this.state.timerVisible ?
                            <View style={{ width: '100%', justifyContent: 'center', alignContent: 'center' }}>
                                <TouchableOpacity style={styles.buttonFinish}
                                    onPress={this._onPress_Finish}
                                    activeOpacity={1}>
                                    <Text style={styles.textFinishButton} >FINISH</Text>
                                </TouchableOpacity>
                                <Text style={styles.contentTextTimer}> {moment.duration(this.state.timeCountDown, "seconds").format()} </Text>
                            </View>
                            :
                            <View style={{ width: '100%' }}>
                                <TouchableOpacity style={{ ...styles.buttonStart, backgroundColor: this.state.ticket && this.state.ticket.time ? '#70cc33' : '#696969' }} onPress={this.state.ticket && this.state.ticket.time ? this._onPress_Start : null} activeOpacity={1}>
                                    <Text style={styles.textScan} >START</Text>
                                </TouchableOpacity>
                                <Text style={{ color: '#FFF', marginTop: 10 }}>
                                    {this.state.ticket ?
                                        "Ticket: " + this.state.ticket.id + "\n" +
                                        "Earn: " + "$" + parseFloat(this.state.ticket.earn).toFixed(2) + "\n" +
                                        "Quantity: " + this.state.ticket.quantity + "\n" +
                                        "Time: " + moment.duration(this.state.ticket.time * 60, "seconds").format() + "\n" +
                                        "Color: " + this.state.ticket.color + "\n" +
                                        "Style: " + this.state.ticket.style + "\n"
                                        :
                                        this.state.ticket === 'undefined' ? 'Ticket not found' : 'Select bundle and operation'
                                    }
                                </Text>
                            </View>
                        }
                    </View>
                </View>

            </View>
        );
    }
}


const itemScrollSize = 30;
const isLandscape = Dimensions.get('window').height < Dimensions.get('window').width;
const DEVICE_WIDTH = Math.round(isLandscape ? Dimensions.get('window').width : Dimensions.get('window').height) - 5;
const DEVICE_HEIGHT = Math.round(isLandscape ? Dimensions.get('window').height : Dimensions.get('window').width) - 5;



const styles = StyleSheet.create({
    container: {
        paddingTop: 3,
        flex: 1,
        alignItems: "center",
        backgroundColor: '#292929'
    },
    containerContent: {
        flexWrap: 'wrap',
        flexDirection: 'row',
        alignItems: "center",
        justifyContent: 'center'
    },
    containerHeader: {
        alignItems: "center",
        justifyContent: 'center',
        width: '100%',
        height: Math.round(DEVICE_HEIGHT * 0.1)
    },
    containerSide: {
        backgroundColor: '#FFF',
        width: Math.round(DEVICE_WIDTH * 0.03),
        height: '90%'
    },
    containerItem: {
        flexWrap: 'wrap',
        flexDirection: 'row',
        alignItems: "center",
        justifyContent: 'center',
        // backgroundColor: '#1F1F1F',
        width: Math.round(DEVICE_WIDTH * 0.3),
        height: Math.round(DEVICE_HEIGHT * 0.4)
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
        padding: 2,
        height: '70%'
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
        width: '100%',
        textAlign: 'center',
        color: 'black',
        fontWeight: 'bold',
        height: '20%',
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
        backgroundColor: '#70cc33',
        borderRadius: 5,
        fontSize: 30,
        marginTop: 5,
        padding: 10,
        color: 'white'
    },
    buttonFinish: {
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#EE5555',
        borderRadius: 5,
        fontSize: 30,
        padding: 10,
        width: '100%',
        color: 'white'
    },
    buttonLogout: {

        flexWrap: 'wrap',
        flexDirection: 'row',
        alignContent: 'center',
        justifyContent: 'center',
        width: '100%'
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
        textAlign: 'center',
        width: '100%',
        color: 'white',
    },
    textScan: {
        fontSize: 20,
        color: 'white'
    },
    textEarning: {
        color: '#FFF',
        alignItems: 'flex-start',
        width: '100%',
        paddingLeft: 5,
        padding: 2
    },
    imageBarCode: {
        height: 100,
        width: 100
    },
    titleTextTimer: {
        color: 'black',
        fontWeight: 'bold',
        fontSize: 30,
        marginBottom: 10
    },
    contentTextTimer: {
        color: '#FFF',
        fontWeight: 'bold',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 50,
        marginBottom: 10,
        width: '100%'
    },
    button: {
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#70cc33',
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
        width: Math.round(DEVICE_WIDTH * 0.25),
        height: itemScrollSize - 5,
        marginBottom: 5,
        borderRadius: 3,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row'
    },
    preview: {
        flex: 1,
        justifyContent: 'flex-end',
        alignItems: 'center',
    }
});

