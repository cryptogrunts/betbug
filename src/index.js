import React from 'react';
import ReactDOM from 'react-dom';
import App from './pages';
import Bets from './pages/Bets';
import { Router, Link } from '@reach/router';

let Home = () => <App />;
let Bet = props => <Bets {...props} />;

let Routes = () => (
  <main>
    <nav className="navbar pure-menu pure-menu-horizontal">
      <Link to="/" className="pure-menu-heading pure-menu-link">
        BET BUG
      </Link>
    </nav>
    <article className="container">
      <Router>
        <Home path="/" />
        <Bet path="/bet/:betId" />
      </Router>
    </article>
  </main>
);

ReactDOM.render(<Routes />, document.getElementById('root'));
