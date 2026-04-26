import React from 'react'
import UserNavBar from '../../user/UserNavBar'
import UserFooter from '../../user/UserFooter'

const UserLayout = ({ children }) => {
  return (
    <div className="container-fluid mx-auto">
      <UserNavBar />
      {children}
      <UserFooter/>
    </div>
  )
}

export default UserLayout