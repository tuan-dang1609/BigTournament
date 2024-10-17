import React from "react";
import { useSelector } from "react-redux";
import { Outlet, Navigate, useLocation } from "react-router-dom";

export default function PrivateRoute() {
  const { currentUser } = useSelector((state) => state.user);
  const location = useLocation(); // Capture the location the user is trying to access

  return currentUser ? (
    <Outlet />
  ) : (
    // Redirect to the sign-in page, with the state storing the from location
    <Navigate to="/signin" state={{ from: location }} />
  );
}
