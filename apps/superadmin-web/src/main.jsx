/**
 * @module main
 * @description Application entry point.
 *              Mounts React, Redux Provider, Ant Design ConfigProvider (dark),
 *              and BrowserRouter. Applies global dark theme.
 */

import React    from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter }  from 'react-router-dom';
import { Provider }       from 'react-redux';
import { ConfigProvider } from 'antd';
import { store }          from '@store/index.js';
import { antdDarkTheme }  from '@theme/antdDarkTheme.js';
import App                from './App.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
      <ConfigProvider theme={antdDarkTheme}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </ConfigProvider>
    </Provider>
  </React.StrictMode>
);
