package com.group2.admin_service.dto;


public class ClaimStatusUpdateDTO {
	
	private String status;
	private String remark;


	public ClaimStatusUpdateDTO() {}
	public ClaimStatusUpdateDTO(String status, String remark) {
		this.status = status;
		this.remark = remark;
	}

	public String getStatus() {
		return status;
	}

	public void setStatus(String status) {
		this.status = status;
	}

	public String getRemark() {
		return remark;
	}

	public void setRemark(String remark) {
		this.remark = remark;
	}
	
	
	

}
