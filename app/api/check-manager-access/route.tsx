import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const managerId = searchParams.get('managerId');
    const subordinateId = searchParams.get('subordinateId');

    if (!managerId || !subordinateId) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
    }

    // Get manager's employee number
    const manager = await prisma.user.findUnique({
      where: { id: managerId },
      select: { employeeNo: true }
    });

    if (!manager || !manager.employeeNo) {
      return NextResponse.json({ hasAccess: false });
    }

    // Get subordinate's employee number
    const subordinate = await prisma.user.findUnique({
      where: { id: subordinateId },
      select: { employeeNo: true }
    });

    if (!subordinate || !subordinate.employeeNo) {
      return NextResponse.json({ hasAccess: false });
    }

    // Check if manager is actually the manager of this subordinate
    const orgRelationship = await prisma.organizationChart.findUnique({
      where: { employeeNo: subordinate.employeeNo },
      select: { managerNo: true }
    });

    const hasAccess = orgRelationship?.managerNo === manager.employeeNo;

    return NextResponse.json({ hasAccess });
  } catch (error) {
    console.error("Error checking manager access:", error);
    return NextResponse.json({ error: "Failed to check manager access" }, { status: 500 });
  }
}