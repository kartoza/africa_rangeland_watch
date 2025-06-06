import React from "react";

interface EditableWrapperProps {
  isEditable: boolean;
  children: React.ReactNode;
}

const EditableWrapper: React.FC<EditableWrapperProps> = ({
  isEditable,
  children,
}) => {
  return isEditable ? <>{children}</> : null;
};

export default EditableWrapper;
