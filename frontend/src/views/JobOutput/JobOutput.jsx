import React from "react";
import PropTypes from 'prop-types';
// @material-ui/core components
import withStyles from "@material-ui/core/styles/withStyles";
import Button from '@material-ui/core/Button';
import Grid from '@material-ui/core/Grid';
import Dialog from '@material-ui/core/Dialog';
// @material-ui/icons
import InsertChartIcon from '@material-ui/icons/InsertChart';
// core components
import GridItem from "components/Grid/GridItem.jsx";
import EnhancedTable from "components/Table/EnhancedTable.jsx";
// models
import api from "../../api";

import AbinitioObjectiveView from "./TargetObjectives/AbinitioObjectiveView.jsx";
import TorsionProfileObjectiveView from "./TargetObjectives/TorsionProfileObjectiveView.jsx";

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
    paddingBottom: "10px",
    fontSize: "30px",
  },
  table: {
    paddingTop: "5px",
  }
}

const targetObjectiveViews = {
  'ABINITIO_GMX': AbinitioObjectiveView,
  'ABINITIO_SMIRNOFF': AbinitioObjectiveView,
  'TORSIONPROFILE_SMIRNOFF': TorsionProfileObjectiveView,
}

class JobOutput extends React.Component {
  state = {
    currentIter: 0,
    optimizerState: {},
    targetsInfo: {},
    dialogTargetName: null,
    dialogTargetType: null,
    dialogOpen: false,
  }

  handleClickIterButton = (e, iter) => {
    this.setState({
      currentIter: iter,
    });
  }

  update = () => {
    api.getAllTargetsInfo(this.updateTargetsInfo);
    this.updateEveryIter()
  }

  updateEveryIter = () => {
    api.getOptimizerState(this.updateOptimizerState);
  }

  updateOptimizerState = (data) => {
    this.setState({
      optimizerState: data,
    })
  }

  updateTargetsInfo = (data) => {
    this.setState({
      targetsInfo: data,
    });
  }

  componentDidMount() {
    api.onChangeProjectName(this.update);
    this.update();
    api.register('update_opt_state', this.updateEveryIter);
  }

  componentWillUnmount() {
    api.removeOnChangeProjectName(this.update);
    api.unregister('update_opt_state', this.updateEveryIter);
  }

  handleObjectiveRowClick = (event, targetName) => {
    if (this.state.targetsInfo[targetName] && this.state.targetsInfo[targetName]['type']) {
      this.setState({
        dialogTargetName: targetName,
        dialogTargetType: this.state.targetsInfo[targetName]['type'],
        dialogOpen: true,
      })
    }
  }

  handleCloseDialog = () => {
    this.setState({
      dialogOpen: false,
    })
  }

  render() {
    const { classes } = this.props;
    const { currentIter, optimizerState, targetsInfo, dialogTargetType, dialogTargetName, dialogOpen } = this.state;
    const iterations = Object.keys(optimizerState).map(s => parseInt(s)).sort((a, b) => a - b);
    const iterButtons = [iterations.map(i => {
      return (<Button key={i} onClick={(e) => this.handleClickIterButton(e, i)} className={classes.iterButton} >
        Iteration {i}
      </Button>);
    })];

    const maxIter = iterations[iterations.length-1];

    // objective details dialog views
    const TargetObjectiveView = targetObjectiveViews[dialogTargetType];
    const TargetObjectiveDialog = dialogOpen ? (<Dialog open={dialogOpen} maxWidth='lg' fullWidth scroll='body'>
      <TargetObjectiveView targetName={dialogTargetName} optIter={currentIter} onClose={this.handleCloseDialog} maxIter={maxIter}/>
    </Dialog>) : <div/>;

    // get target names that has available objective views
    const targetsWithObjectiveViews = {};
    for (let targetName in targetsInfo) {
      if (targetsInfo[targetName]['type'] in targetObjectiveViews) {
        targetsWithObjectiveViews[targetName] = true;
      }
    }

    return (
      <div className={classes.wrap}>
        <div className={classes.leftPanel}>
          {iterButtons}
        </div>
        <div className={classes.rightPanel}>
          <p className={classes.title}>Iteration {currentIter}</p>
          {(currentIter in optimizerState) ?
            <Grid>
              <GridItem xs={12} sm={12} md={12}>
                <div className={classes.table}>
                  <ObjectiveTable optstate={optimizerState[currentIter]} handleRowClick={this.handleObjectiveRowClick} targetsWithObjectiveViews={targetsWithObjectiveViews}/>
                </div>
              </GridItem>
              <GridItem xs={12} sm={12} md={12}>
                <div className={classes.table}>
                  <GradientsTable data={optimizerState[currentIter].paramUpdates} />
                </div>
              </GridItem>
            </Grid> :
            "Waiting for optimization results data"
          }
        </div>
        {TargetObjectiveDialog}
      </div>
    );
  }

}

JobOutput.propTypes = {
  classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(JobOutput);

function ObjectiveTable(props) {
  const objdict = props.optstate.objdict;
  const objTotal = props.optstate.objTotal;
  const rows = [];
  for (const objName in objdict) {
    const w = objdict[objName].w;
    const x = objdict[objName].x;
    let hasObjView = '';
    if (props.targetsWithObjectiveViews && (objName in props.targetsWithObjectiveViews)) {
      hasObjView =  <InsertChartIcon />;
    }
    rows.push([objName, hasObjView, w, x, w*x]);
  }
  const title = "Objective Breakdown ( Total + Penalty = " + parseFloat(objTotal).toFixed(4) + " )";
  return (
    <EnhancedTable
      tableHead={["Target", "Details", "Weight", "Objective", "Contribution"]}
      data={rows}
      title={title}
      handleRowClick={props.handleRowClick}
    />
  );
}

function GradientsTable(props) {
  const data = props.data;
  const rows = [];
  for (const pName in data) {
    rows.push([pName, data[pName].gradient, data[pName].prev_pval, data[pName].pval]);
  }
  return (
    <EnhancedTable
      tableHead={["Parameter", "Gradient", "Prev", "New"]}
      data={rows}
      title="Parameter Updates"
    />
  );
}