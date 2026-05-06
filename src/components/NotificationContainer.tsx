import React from 'react'
import { useNotifications } from '../context/NotificationContext'
import '../styles/NotificationContainer.css'

export const NotificationContainer: React.FC = () => {
  const { notifications, removeNotification } = useNotifications()

  return (
    <div className="notification-container">
      {notifications.map(notification => (
        <div
          key={notification.id}
          className={`notification notification-${notification.type}`}
          onClick={() => removeNotification(notification.id)}
        >
          <span>{notification.message}</span>
          <button className="notification-close" onClick={() => removeNotification(notification.id)}>
            ×
          </button>
        </div>
      ))}
    </div>
  )
}
