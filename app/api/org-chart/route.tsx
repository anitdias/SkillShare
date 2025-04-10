import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// Define interface for tree node structure
interface TreeNode {
  id: string;
  employeeNo: string;
  name: string;
  children: (TreeNode | null)[];
}

export async function GET() {
  try {
    const orgData = await prisma.organizationChart.findMany();

    // Find the root node (top-level manager)
    const rootNode = orgData.find(node => !node.managerNo);
    
    // Function to build tree structure with proper return type
    const buildTree = (employeeNo: string): TreeNode | null => {
      const node = orgData.find(n => n.employeeNo === employeeNo);
      if (!node) return null;
      
      return {
        id: node.id,
        employeeNo: node.employeeNo,
        name: node.employeeName, // Add position/designation
        children: orgData
          .filter(n => n.managerNo === node.employeeNo)
          .map(child => buildTree(child.employeeNo))
          .filter(Boolean) as TreeNode[]
      };
    };

    const treeData = rootNode ? buildTree(rootNode.employeeNo) : null;
    
    return NextResponse.json(treeData);
  } catch (error) {
    console.error("Error fetching org chart:", error);
    return NextResponse.json({ error: "Failed to fetch organization chart" }, { status: 500 });
  }
}