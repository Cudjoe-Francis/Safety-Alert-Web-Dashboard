import React from "react";
import { sampleAlerts } from "../features/alerts/sampleAlerts";
import { theme } from "../theme";

const History: React.FC = () => {
  return (
    <div>
      <h2>Alert History</h2>
      <table
        style={{
          width: "100%",
          background: theme.card,
          borderCollapse: "collapse",
          boxShadow: `0 2px 8px ${theme.shadow}`,
        }}
      >
        <thead>
          <tr style={{ background: theme.background }}>
            <th
              style={{
                border: `1px solid ${theme.border}`,
                padding: 8,
              }}
            >
              User
            </th>
            <th
              style={{
                border: `1px solid ${theme.border}`,
                padding: 8,
              }}
            >
              Service
            </th>
            <th
              style={{
                border: `1px solid ${theme.border}`,
                padding: 8,
              }}
            >
              Time
            </th>
            <th
              style={{
                border: `1px solid ${theme.border}`,
                padding: 8,
              }}
            >
              Location
            </th>
            <th
              style={{
                border: `1px solid ${theme.border}`,
                padding: 8,
              }}
            >
              Message
            </th>
          </tr>
        </thead>
        <tbody>
          {sampleAlerts.map((alert) => (
            <tr key={alert.id}>
              <td
                style={{
                  border: `1px solid ${theme.border}`,
                  padding: 8,
                }}
              >
                {alert.userName}
              </td>
              <td
                style={{
                  border: `1px solid ${theme.border}`,
                  padding: 8,
                }}
              >
                {alert.serviceType}
              </td>
              <td
                style={{
                  border: `1px solid ${theme.border}`,
                  padding: 8,
                }}
              >
                {alert.time}
              </td>
              <td
                style={{
                  border: `1px solid ${theme.border}`,
                  padding: 8,
                }}
              >
                {alert.location}
              </td>
              <td
                style={{
                  border: `1px solid ${theme.border}`,
                  padding: 8,
                }}
              >
                {alert.message}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default History;
