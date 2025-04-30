import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// Define interface for tree node structure
interface TreeNode {
  id: string;
  employeeNo: string;
  name: string;
  userId: string | null; // Add userId to the tree node
  children: (TreeNode | null)[];
}

export async function GET() {
  try {
    // Get all organization chart data
    const orgData = await prisma.organizationChart.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    // Find the root node (top-level manager)
    const rootNode = orgData.find(node => !node.managerNo);
    
    // Function to build tree structure with proper return type
    const buildTree = (employeeNo: string): TreeNode | null => {
      const node = orgData.find(n => n.employeeNo === employeeNo);
      if (!node) return null;
      
      return {
        id: node.id,
        employeeNo: node.employeeNo,
        name: node.employeeName,
        userId: node.user?.id || null, // Include user ID if available
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

export async function PUT(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has admin role
    if (session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    // Parse request body
    const { employeeNo, employeeName, managerNo, managerName, effectiveDate } = await req.json();

    // Validate required fields
    if (!employeeNo || !employeeName) {
      return NextResponse.json({ error: "Employee number and name are required" }, { status: 400 });
    }

    // Check if employee number already exists
    const existingEmployee = await prisma.organizationChart.findUnique({
      where: { employeeNo }
    });

    if (existingEmployee) {
      return NextResponse.json({ error: "Employee with this number already exists" }, { status: 409 });
    }

    // If manager is specified, verify it exists
    if (managerNo) {
      const managerExists = await prisma.organizationChart.findUnique({
        where: { employeeNo: managerNo }
      });

      if (!managerExists) {
        return NextResponse.json({ error: "Specified manager does not exist" }, { status: 404 });
      }
    }

    // Create new employee in org chart
    const newEmployee = await prisma.organizationChart.create({
      data: {
        employeeNo,
        employeeName,
        managerNo: managerNo || null,
        managerName: managerName || null,
        effectiveDate: effectiveDate ? new Date(effectiveDate) : null
      }
    });

    return NextResponse.json(newEmployee);
  } catch (error) {
    console.error("Error adding employee to org chart:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to add employee" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { employeeNo } = await request.json();
    
    if (!employeeNo) {
      return new Response(JSON.stringify({ error: "Employee number is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    
    // Delete the employee from your database
    // This is just an example - adjust according to your actual database setup
    await prisma.organizationChart.delete({
      where: {
        employeeNo: employeeNo
      }
    });
    
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error deleting employee:", error);
    return new Response(JSON.stringify({ error: "Failed to delete employee" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}