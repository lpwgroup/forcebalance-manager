import io from 'socket.io-client';

class ForceBalanceAPI {
    socket = io('http://127.0.0.1:5005/api');
    projectName = null;
    eventCallbacks = {};
    onChangeCallbacks = [];

    checkProject() {
        this.socket.emit('list_projects', (data) => {
            if (data.length > 0) {
                this.setProject(data[0].projectName);
            }
        });
    }

    onChangeProjectName(callback) {
        if (this.onChangeCallbacks.indexOf(callback) === -1) {
            this.onChangeCallbacks.push(callback);
        }
    }

    setProject(name) {
        if (this.projectName !== name) {
            this.projectName = name;
            this.onChangeCallbacks.forEach(callback => {
                callback(name);
            })
        }
    }

    createProject(name) {
        this.socket.emit('create_project', name);
        this.setProject(name);
    }

    listProjects(callback) {
        this.socket.emit('list_projects', (data) => {callback(data)});
    }

    getInputParams(callback) {
        if (this.projectName !== null) {
            this.socket.emit('get_input_params', this.projectName, (data) => {callback(data)});
        }
    }

    launchOptimizer() {
        if (this.projectName !== null) {
            this.socket.emit('launch_optimizer', this.projectName);
        }
    }

    resetOptimizer() {
        if (this.projectName !== null) {
            this.socket.emit('reset_optimizer', this.projectName);
        }
    }

    pullStatus() {
        if (this.projectName !== null) {
            this.socket.emit('pull_status', this.projectName);
        }
    }

    register(event, callback) {
        if (event in this.eventCallbacks) {
            // append this callback function only if it does not exist yet
            if (this.eventCallbacks[event].indexOf(callback) !== -1) {
                this.eventCallbacks[event].push(callback);
            }
        } else {
            // new event is created, together with a socket listener
            this.eventCallbacks[event] = [callback];
            this.socket.on(event, (data) => {
                // Only call the function if return projectName matches the current one
                if (data.projectName === this.projectName) {
                    this.eventCallbacks[event].forEach(callback => {
                        callback(data);
                    })
                }
            });
        }
    }
}

const api = new ForceBalanceAPI();

export default api;