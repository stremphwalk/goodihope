import React from "react";
import { PMHEditor } from "@/components/pmh/PMHEditor";
export function registerPMHWidget(registry:any){ registry.register("pmh", () => <PMHEditor/>); }