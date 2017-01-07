import React, { Component } from 'react'

class Button extends Component {

  render () {

    const { onClick, leftIcon, children, selected, disabled, style, ...props } = this.props

    const boxShadow = '0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24)'
    const activeStyle = { color: 'white', background: '#268bd2', boxShadow }

    const customStyle = selected
      ? activeStyle
      : disabled
        ? { cursor: 'default', color: 'grey', border: '1px solid #adadad' }
        : { boxShadow }

    const styles = {
      ...style,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 10,
      border: '1px solid transparent',
      ...customStyle,
    }

    return (
      <div
        className={`btn ${disabled ? 'disabled' : 'hoverable'}`}
        onClick={disabled ? f => f : onClick}
        style={styles}
        {...props}>
        {leftIcon && (<i className={leftIcon} style={{ marginRight: 5 }} />)}
        {children}
      </div>
    )

  }
}

export default Button
