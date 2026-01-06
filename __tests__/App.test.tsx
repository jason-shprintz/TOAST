/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
// Mock the App module before importing
jest.mock('../App');
import App from '../App';

test('renders correctly', () => {
  let instance: any;
  ReactTestRenderer.act(() => {
    instance = ReactTestRenderer.create(<App />);
  });
  expect(instance).toBeTruthy();
});
