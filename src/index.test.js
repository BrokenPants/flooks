import React from 'react';
import { configure, shallow, mount } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import useModel from './index';

configure({ adapter: new Adapter() });

console.error = jest.fn((msg) => {
  if (!msg.includes('test was not wrapped in act(...)')) throw new Error(msg);
});

const withoutCheck = (fn) => {
  process.env.NODE_ENV = 'production';
  fn();
  process.env.NODE_ENV = 'test';
};

test('useModel', (done) => {
  expect(() => {
    useModel();
  }).toThrow();

  const counterModel = (now) => ({
    count: 0,
    add() {
      const { count } = now();
      now({ count: count + 1 });
    },
    async addAsync() {
      const { add } = now();
      await new Promise((resolve) => setTimeout(resolve, 0));
      add();
    },
  });
  const errModel = (now) => ({
    errOutModel() {
      const { add } = now(counterModel);
      add();
      const { test } = now(() => {});
    },
    errPayload() {
      now([]);
    },
  });

  withoutCheck(() => {
    const CounterProd = () => {
      useModel(counterModel);
      return <div />;
    };
    shallow(<CounterProd />);
  });

  const ErrKeys = () => {
    useModel(counterModel, {});
    return <div />;
  };
  expect(() => {
    shallow(<ErrKeys />);
  }).toThrow();

  const Counter = () => {
    const { count } = useModel(counterModel);
    const { add } = useModel(counterModel, ['add']);
    const { addAsync } = useModel(counterModel);
    const { errOutModel, errPayload } = useModel(errModel, []);

    return (
      <>
        <p>{count}</p>
        <button id="add" onClick={add} />
        <button id="addAsync" onClick={addAsync} />
        <button id="errOutModel" onClick={errOutModel} />
        <button id="errPayload" onClick={errPayload} />
      </>
    );
  };
  const wrapper = mount(<Counter />);

  wrapper.find('#add').simulate('click');
  wrapper.find('#addAsync').simulate('click');

  expect(() => {
    wrapper.find('#errOutModel').simulate('click');
  }).toThrow();
  expect(() => {
    wrapper.find('#errPayload').simulate('click');
  }).toThrow();

  setTimeout(() => {
    wrapper.unmount();
    done();
  }, 0);
});
