import { Component } from 'react';

export default class AutopilotErrorBoundary extends Component {
  state={failed:false};
  static getDerivedStateFromError(){return {failed:true};}
  componentDidCatch(error){console.error('Autopilot view failed',error);}
  render(){return this.state.failed?<section className="panel"><h2>Autopilot paused</h2><p className="muted">Your saved plan is safe. Reload this view to continue.</p><button className="secondary" onClick={()=>this.setState({failed:false})}>Retry</button></section>:this.props.children;}
}
