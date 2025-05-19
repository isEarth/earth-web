// import logo from './logo.svg';
// import './App.css';

// function App() {
//   return (
//     <div className="App">
//       <header className="App-header">
//         <img src={logo} className="App-logo" alt="logo" />
//         <p>
//           Edit <code>src/App.js</code> and save to reload.
//         </p>
//         <a
//           className="App-link"
//           href="https://reactjs.org"
//           target="_blank"
//           rel="noopener noreferrer"
//         >
//           Learn React
//         </a>
//       </header>
//     </div>
//   );
// }

// export default App;

import React, {useEffect, useState} from 'react';
import axios from 'axios';

function App() {
   const [data, setData] = useState('')

    useEffect(() => {
        axios.get('/api/data')
        .then(res => setData(res.data))
        .catch(err => console.log(err))
    }, []);

    return (
        <div>
            받아온 값 : {data}
        </div>
    );
}

export default App;