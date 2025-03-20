import React, { useEffect } from "react";
import {
  Table, Thead, Tbody, Tr, Th, Td, Switch, Select, Input, Checkbox
} from "@chakra-ui/react";
import { formatDistanceToNow } from "date-fns";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "../../store";
import { fetchIndicators, updateIndicator } from "../../store/indicatorSlice"

export default function SystemTab() {
  const dispatch: AppDispatch = useDispatch();
  const { indicators, loading, error } = useSelector((state: RootState) => state.indicators);

  // Fetch indicators on mount
  useEffect(() => {
    console.log('triggered')
    dispatch(fetchIndicators());
  }, [dispatch]);

  // Handle updates
  const handleUpdate = (id: number, field: keyof typeof indicators[0], value: any) => {
    dispatch(updateIndicator({ ...indicators.find((ind) => ind.id === id)!, [field]: value }));
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <Table variant="simple">
      <Thead bg="gray.100">
        <Tr>
          <Th>Indicators</Th>
          <Th>Enable Alerting</Th>
          <Th>Alert Trigger</Th>
          <Th>Last Triggered</Th>
          <Th>Threshold Value</Th>
          <Th>Anomaly Detection Alert</Th>
          <Th>Email</Th>
          <Th>In-App</Th>
        </Tr>
      </Thead>
      <Tbody>
        {indicators.map((notification) => (
          <Tr key={notification.id}>
            <Td>{notification.indicator}</Td>
            <Td>
              <Switch
                colorScheme="green"
                size="lg"
                isChecked={notification.alert}
                onChange={(e) => handleUpdate(notification.id, "alert", e.target.checked)}
              />
            </Td>
            <Td>
              <Select
                placeholder="Select trigger"
                defaultValue={notification.alertTrigger}
                onChange={(e) => handleUpdate(notification.id, "alertTrigger", e.target.value)}
              >
                <option value="lessThan">Less Than</option>
                <option value="greaterThan">Greater Than</option>
                <option value="equalTo">Equal To</option>
              </Select>
            </Td>
            <Td>{formatDistanceToNow(new Date(notification.lastTriggered))} ago</Td>
            <Td>
              <Input
                type="number"
                value={notification.threshold}
                onChange={(e) => handleUpdate(notification.id, "threshold", parseFloat(e.target.value))}
              />
            </Td>
            <Td>
              <Switch
                colorScheme="green"
                size="lg"
                isChecked={notification.anomalyDetectionAlert}
                onChange={(e) => handleUpdate(notification.id, "anomalyDetectionAlert", e.target.checked)}
              />
            </Td>
            <Td>
              <Checkbox
                colorScheme="green"
                isChecked={notification.email}
                onChange={(e) => handleUpdate(notification.id, "email", e.target.checked)}
              />
            </Td>
            <Td>
              <Checkbox
                colorScheme="green"
                isChecked={notification.platform}
                onChange={(e) => handleUpdate(notification.id, "platform", e.target.checked)}
              />
            </Td>
          </Tr>
        ))}
      </Tbody>
    </Table>
  );
}
