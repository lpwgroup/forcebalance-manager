import React from "react";
import PropTypes from 'prop-types';
// @material-ui/core components
import withStyles from "@material-ui/core/styles/withStyles";
import Button from '@material-ui/core/Button';
import Grid from '@material-ui/core/Grid';
import Paper from '@material-ui/core/Paper';
// @material-ui/icons
import FileCopyIcon from "@material-ui/icons/FileCopy";
import Store from "@material-ui/icons/Store";
import ErrorOutlineIcon from "@material-ui/icons/ErrorOutline";
import Update from "@material-ui/icons/Update";
import Accessibility from "@material-ui/icons/Accessibility";
// core components
import GridItem from "components/Grid/GridItem.jsx";
import Card from "components/Card/Card.jsx";
import CardHeader from "components/Card/CardHeader.jsx";
import CardIcon from "components/Card/CardIcon.jsx";
import CardFooter from "components/Card/CardFooter.jsx";
// models
import api from "../../api";

const styles = {
  wrap: {
    width: '100%',
    overflow: 'auto',
  },
  leftPanel: {
    float: "left",
    width: "15%",
    paddingTop: "5vh",
  },
  rightPanel: {
    float: 'right',
    width: "85%",
    maxWidth: "85%",
  },
  iterButton: {
    padding: "15px",
  },
  title: {
    fontFamily: "'Roboto', 'Helvetica', 'Arial', sans-serif",
    paddingBottom: "20px",
    fontSize: "30px",
  },
  cardCategory: {
    color: "#999999",
    margin: "0",
    fontSize: "14px",
    marginTop: "0",
    paddingTop: "10px",
    marginBottom: "0"
  },
  cardTitle: {
    color: "#3C4858",
    marginTop: "0px",
    minHeight: "auto",
    fontWeight: "300",
    fontFamily: "'Roboto', 'Helvetica', 'Arial', sans-serif",
    marginBottom: "3px",
    textDecoration: "none",
    "& small": {
      color: "#777",
      fontSize: "65%",
      fontWeight: "400",
      lineHeight: "1"
    }
  },
}

class WorkQueue extends React.Component {
  state = {
    wqStatus: { code: 'not_connected', description: 'server not connected' },
    lastUpdateTime: new Date(),
    timePassed: 0,
  }

  update = () => {
    api.getWorkQueueStatus(this.updateWorkQueueStatus);
  }

  updateStatus = (data) => {
    this.setState({
      status: data.status
    });
  }

  updateWorkQueueStatus = (data) => {
    this.setState({
      wqStatus: data,
      lastUpdateTime: new Date(),
    })
  }

  updateTimePassed = () => {
    if (this.state.lastUpdateTime !== null) {
      this.setState({
        timePassed: Math.round((new Date() - this.state.lastUpdateTime) / 1000),
      });
    }
  }

  componentDidMount() {
    api.onChangeProjectName(this.update);
    this.update();
    api.register('update_status', this.updateStatus);
    api.register('update_work_queue_status', this.update);
    api.pullStatus();
    this.timer = setInterval(this.updateTimePassed, 1000);
  }

  componentWillUnmount() {
    api.removeOnChangeProjectName(this.update);
    api.unregister('update_status', this.updateStatus);
    api.unregister('update_work_queue_status', this.update);
    clearInterval(this.timer);
  }

  render() {
    const { classes } = this.props;
    const { status, wqStatus, timePassed } = this.state;
    // display ready status if not running
    let readyButton = <Button variant="outlined" color="secondary">
      not ready
    </Button>;
    let statusDetails = <div style={{ margin: 10 }}>
      <div >
        Status: {wqStatus.code}
      </div>
      <div>
        Description: {wqStatus.description}
      </div>
      <div>
        Workers: {wqStatus.worker_running}/{wqStatus.worker_total}
      </div>
      <div>
        Jobs: {wqStatus.job_finished}/{wqStatus.job_total}
      </div>
    </div>;
    if (wqStatus) {
      readyButton = <Button variant="outlined" color="primary">
        {wqStatus.code}
      </Button>;
      // statusDetails = null;
    }
    return (
      <div>
        <Paper style={{ padding: 20 }}>
          <div style={{ margin: 10 }}>
            Work Queue system {readyButton}
          </div>
          {statusDetails}
        </Paper>
        <Grid container>
        <GridItem xs={12} sm={6} md={3}>
          <Card>
            <CardHeader color="warning" stats icon>
              <CardIcon color="warning">
                <FileCopyIcon />
              </CardIcon>
              <p className={classes.cardCategory}>Running Workers</p>
              <h3 className={classes.cardTitle}>{wqStatus.worker_running}</h3>
            </CardHeader>
            <CardFooter stats>
              <div className={classes.stats}>
                <Update />
                Updated {timePassed}s ago
              </div>
              </CardFooter>
          </Card>
        </GridItem>
        <GridItem xs={12} sm={6} md={3}>
          <Card>
            <CardHeader color="success" stats icon>
              <CardIcon color="success">
                <Store />
              </CardIcon>
              <p className={classes.cardCategory}>Total Workers</p>
              <h3 className={classes.cardTitle}>{wqStatus.worker_total}</h3>
            </CardHeader>
            <CardFooter stats>
              <div className={classes.stats}>
                <Update />
                Updated {timePassed}s ago
              </div>
            </CardFooter>
          </Card>
        </GridItem>
        <GridItem xs={12} sm={6} md={3}>
          <Card>
            <CardHeader color="danger" stats icon>
              <CardIcon color="danger">
                <ErrorOutlineIcon />
              </CardIcon>
              <p className={classes.cardCategory}>Jobs Finished</p>
              <h3 className={classes.cardTitle}>{wqStatus.job_finished}</h3>
            </CardHeader>
            <CardFooter stats>
              <div className={classes.stats}>
                <Update />
                Updated {timePassed}s ago
              </div>
            </CardFooter>
          </Card>
        </GridItem>
        <GridItem xs={12} sm={6} md={3}>
          <Card>
            <CardHeader color="info" stats icon>
              <CardIcon color="info">
                <Accessibility />
              </CardIcon>
              <p className={classes.cardCategory}>Jobs Submitted</p>
              <h3 className={classes.cardTitle}>{wqStatus.job_total}</h3>
            </CardHeader>
            <CardFooter stats>
              <div className={classes.stats}>
                <Update />
                Updated {timePassed}s ago
              </div>
            </CardFooter>
          </Card>
        </GridItem>
      </Grid>
      </div>
    );

  }

}

WorkQueue.propTypes = {
  classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(WorkQueue);