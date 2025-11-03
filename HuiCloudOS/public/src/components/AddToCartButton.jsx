import React from 'react';

export const AddToCartButton = ({ onClick }) => (
  <button className="button" style={{ width: '100%' }} onClick={onClick}>
    加入购物车
  </button>
);

export default AddToCartButton;
