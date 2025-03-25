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
    dispatch(fetchIndicators());
  }, [dispatch]);

  // Handle updates
  const handleUpdate = (id: number, field: keyof typeof indicators[0], value: any) => {
    dispatch(updateIndicator({ ...indicators.find((ind: { id: number; }) => ind.id === id)!, [field]: value }));
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
        {(Array.isArray(indicators?.results) ? indicators?.results : []).map((notification: any) => (
          <Tr key={notification.id}>
            <Td>{notification?.name}</Td>
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
                border="1px solid gray"
              >
                <option value="lessThan">Less Than</option>
                <option value="greaterThan">Greater Than</option>
                <option value="equalTo">Equal To</option>
              </Select>
            </Td>
            <Td>
              {notification?.lastTriggered
                ? `${formatDistanceToNow(new Date(notification.lastTriggered))} ago`
                : "N/A"}
            </Td>
            <Td>
              <Input
                type="number"
                value={notification.threshold}
                onChange={(e) => handleUpdate(notification.id, "threshold", parseFloat(e.target.value))}
                border="1px solid gray"
                _focus={{ borderColor: "#3182CE", boxShadow: "0 0 0 1px #55aa7f" }}
                _hover={{ borderColor: "black" }}
                
              />
            </Td>

            <Td>
              <Switch
                colorScheme="green"
                size="lg"
                isChecked={notification?.anomalyDetectionAlert}
                onChange={(e) => handleUpdate(notification.id, "anomalyDetectionAlert", e.target.checked)}
              />
            </Td>
            <Td>
              <Checkbox
                colorScheme="green"
                isChecked={notification?.email}
                onChange={(e) => handleUpdate(notification.id, "email", e.target.checked)}
              />
            </Td>
            <Td>
              <Checkbox
                colorScheme="green"
                isChecked={notification?.platform}
                onChange={(e) => handleUpdate(notification.id, "platform", e.target.checked)}
              />
            </Td>
          </Tr>
        ))}
      </Tbody>
    </Table>
  );
}
